import { findDumpFile } from "./find-dump";
import { parseCiqualFile } from "./parse-ciqual";
import { parseFridaFile } from "./parse-frida";
import type { FoodSource } from "./types";
import {
  markImportRunFailed,
  upsertFoods,
  type UpsertOptions,
  type UpsertResult,
} from "./upsert";

export async function importSource(
  source: FoodSource,
  options?: UpsertOptions,
): Promise<UpsertResult | null> {
  try {
    const path = findDumpFile(source);
    console.log(`[foods] Parsing ${source} from ${path}…`);
    const rows =
      source === "ciqual" ? parseCiqualFile(path) : parseFridaFile(path);
    console.log(`[foods] Parsed ${rows.length} ${source} foods with macros`);

    if (rows.length === 0) {
      console.warn(`[foods] Skipping upsert for ${source}: no usable rows`);
      if (options?.runId !== undefined) {
        await markImportRunFailed(options.runId, "no usable rows");
      }
      return null;
    }

    return await upsertFoods(source, rows, options);
  } catch (error) {
    // Parse / IO failures happen before upsertFoods owns the run — mark failed here.
    if (options?.runId !== undefined) {
      const message = error instanceof Error ? error.message : String(error);
      await markImportRunFailed(options.runId, message);
    }
    throw error;
  }
}
