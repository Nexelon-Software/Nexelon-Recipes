import { desc, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { foodImportRuns } from "~/server/db/schema";

import { ensureDumpDownloaded } from "./download-dump";
import { importSource } from "./import-source";
import type { FoodSource } from "./types";
import { claimImportRun, markImportRunFailed } from "./upsert";

/** CIQUAL disabled for now (French-only dump). Re-enable when needed. */
const SOURCES: FoodSource[] = ["frida"];
/** Abandoned locks (crash mid-import) are cleared after this age. */
const STALE_RUNNING_MS = 15 * 60 * 1000;

function sixMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d;
}

type LatestRun = {
  id: number;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
};

async function getLatestRun(source: FoodSource): Promise<LatestRun | null> {
  const row = await db.query.foodImportRuns.findFirst({
    where: eq(foodImportRuns.source, source),
    orderBy: [desc(foodImportRuns.startedAt)],
    columns: {
      id: true,
      status: true,
      startedAt: true,
      finishedAt: true,
    },
  });
  return row ?? null;
}

async function markStaleRunning(run: LatestRun): Promise<void> {
  await markImportRunFailed(run.id, "stale lock");
}

/**
 * Returns true when this source should be imported now.
 * Mutates stale `running` rows to `failed` before returning true.
 */
async function shouldUpdateSource(source: FoodSource): Promise<boolean> {
  const latest = await getLatestRun(source);

  if (!latest) return true;

  if (latest.status === "running") {
    const age = Date.now() - latest.startedAt.getTime();
    if (age <= STALE_RUNNING_MS) {
      console.log(
        `[foods] Skipping ${source}: import already running (run #${latest.id})`,
      );
      return false;
    }
    console.warn(
      `[foods] Stale running lock for ${source} (run #${latest.id}); marking failed`,
    );
    await markStaleRunning(latest);
    return true;
  }

  if (latest.status === "failed") {
    return true;
  }

  if (latest.status === "success") {
    const finishedAt = latest.finishedAt ?? latest.startedAt;
    if (finishedAt <= sixMonthsAgo()) {
      return true;
    }
    console.log(
      `[foods] Skipping ${source}: last success within 6 months (run #${latest.id})`,
    );
    return false;
  }

  // Unknown status — treat as needing a refresh.
  return true;
}

async function syncSource(source: FoodSource): Promise<void> {
  if (!(await shouldUpdateSource(source))) return;

  const runId = await claimImportRun(source);
  if (runId === null) {
    console.log(
      `[foods] Skipping ${source}: could not claim lock (another run in progress)`,
    );
    return;
  }

  try {
    await ensureDumpDownloaded(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markImportRunFailed(runId, message);
    console.error(`[foods] Download failed for ${source}`, error);
    return;
  }

  try {
    const result = await importSource(source, { runId });
    if (result) {
      console.log(
        `[foods] Upserted ${result.rowCount} ${source} rows (v${result.sourceVersion}, run #${result.importRunId})`,
      );
    }
  } catch (error) {
    // Safety net: importSource should already have marked failed for parse errors.
    const message = error instanceof Error ? error.message : String(error);
    await markImportRunFailed(runId, message);
    console.error(`[foods] Auto sync failed for ${source}`, error);
  }
}

/** Check import runs and refresh CIQUAL / Frida caches when due. Safe to call fire-and-forget. */
export async function maybeSyncFoods(): Promise<void> {
  for (const source of SOURCES) {
    await syncSource(source);
  }
}
