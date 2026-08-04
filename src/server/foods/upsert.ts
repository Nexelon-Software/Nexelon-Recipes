import { eq, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { foodImportRuns, foods } from "~/server/db/schema";

import type { FoodSource, NormalizedFood } from "./types";

const BATCH_SIZE = 200;

export type UpsertResult = {
  source: FoodSource;
  sourceVersion: string;
  rowCount: number;
  importRunId: number;
};

export type UpsertOptions = {
  /** Existing claimed `foodImportRun` id (status running). */
  runId?: number;
};

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code =
    "code" in error
      ? String(error.code)
      : "cause" in error &&
          error.cause &&
          typeof error.cause === "object" &&
          "code" in error.cause
        ? String(error.cause.code)
        : null;
  return code === "23505";
}

/** Claim exclusive in-progress lock for a source. Returns null if another run owns the lock. */
export async function claimImportRun(
  source: FoodSource,
): Promise<number | null> {
  try {
    const [run] = await db
      .insert(foodImportRuns)
      .values({
        source,
        sourceVersion: "pending",
        rowCount: 0,
        startedAt: new Date(),
        status: "running",
      })
      .returning({ id: foodImportRuns.id });

    return run?.id ?? null;
  } catch (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }
}

export async function markImportRunFailed(
  runId: number,
  notes: string,
): Promise<void> {
  await db
    .update(foodImportRuns)
    .set({
      finishedAt: new Date(),
      status: "failed",
      notes: notes.slice(0, 4000),
    })
    .where(eq(foodImportRuns.id, runId));
}

export async function upsertFoods(
  source: FoodSource,
  rows: NormalizedFood[],
  options?: UpsertOptions,
): Promise<UpsertResult> {
  const sourceVersion = rows[0]?.sourceVersion ?? "unknown";
  const startedAt = new Date();

  let runId = options?.runId;
  if (runId === undefined) {
    const [run] = await db
      .insert(foodImportRuns)
      .values({
        source,
        sourceVersion,
        rowCount: 0,
        startedAt,
        status: "running",
      })
      .returning({ id: foodImportRuns.id });

    if (!run) {
      throw new Error("Failed to create foodImportRun row");
    }
    runId = run.id;
  } else {
    await db
      .update(foodImportRuns)
      .set({ sourceVersion })
      .where(eq(foodImportRuns.id, runId));
  }

  try {
    const now = new Date();
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((row) => ({
        source: row.source,
        externalId: row.externalId,
        sourceVersion: row.sourceVersion,
        name: row.name.slice(0, 512),
        nameEn: row.nameEn?.slice(0, 512) ?? null,
        language: row.language,
        foodGroup: row.foodGroup?.slice(0, 256) ?? null,
        caloriesKcalPer100g: row.caloriesKcalPer100g,
        proteinGPer100g: row.proteinGPer100g,
        carbsGPer100g: row.carbsGPer100g,
        fatGPer100g: row.fatGPer100g,
        importedAt: now,
        updatedAt: now,
      }));

      await db
        .insert(foods)
        .values(batch)
        .onConflictDoUpdate({
          target: [foods.source, foods.externalId],
          set: {
            // DB columns are camelCase (see existing drizzle_* migrations).
            sourceVersion: sql.raw(`excluded."sourceVersion"`),
            name: sql.raw(`excluded."name"`),
            nameEn: sql.raw(`excluded."nameEn"`),
            language: sql.raw(`excluded."language"`),
            foodGroup: sql.raw(`excluded."foodGroup"`),
            caloriesKcalPer100g: sql.raw(`excluded."caloriesKcalPer100g"`),
            proteinGPer100g: sql.raw(`excluded."proteinGPer100g"`),
            carbsGPer100g: sql.raw(`excluded."carbsGPer100g"`),
            fatGPer100g: sql.raw(`excluded."fatGPer100g"`),
            importedAt: sql.raw(`excluded."importedAt"`),
            updatedAt: sql.raw(`excluded."updatedAt"`),
          },
        });
    }

    await db
      .update(foodImportRuns)
      .set({
        rowCount: rows.length,
        finishedAt: new Date(),
        status: "success",
      })
      .where(eq(foodImportRuns.id, runId));

    return {
      source,
      sourceVersion,
      rowCount: rows.length,
      importRunId: runId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markImportRunFailed(runId, message);
    throw error;
  }
}
