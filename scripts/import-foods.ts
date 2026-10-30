/**
 * Import Frida + CIQUAL food composition dumps into `drizzle_food`.
 *
 * Attribution:
 * - CIQUAL (ANSES) — etalab 2.0 — https://doi.org/10.57745/rdmhwy
 * - Frida (DTU) — CC-BY 4.0 — https://doi.org/10.11583/dtu.29500682
 *
 * Run from repo root (requires DATABASE_URL and applied food migrations):
 *   npm run foods:import
 *   npm run foods:import -- --source=ciqual
 *   npm run foods:import -- --source=frida
 *   npm run foods:import -- --download
 *
 * Without --download, place dumps under data/foods/raw/ — see data/foods/README.md.
 * On app boot, `instrumentation.ts` downloads + imports when due (6 months / failed).
 */
import "dotenv/config";

import { ensureDumpDownloaded } from "~/server/foods/download-dump";
import { importSource } from "~/server/foods/import-source";
import type { FoodSource } from "~/server/foods/types";

function parseSourceArg(argv: string[]): FoodSource | "all" {
  const flag = argv.find((arg) => arg.startsWith("--source="));
  if (!flag) return "all";
  const value = flag.slice("--source=".length).toLowerCase();
  if (value === "ciqual" || value === "frida" || value === "all") {
    return value;
  }
  throw new Error(`Invalid --source=${value}. Use ciqual | frida | all.`);
}

function wantsDownload(argv: string[]): boolean {
  return argv.includes("--download");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const source = parseSourceArg(argv);
  const download = wantsDownload(argv);
  // CIQUAL omitted from "all" for now (French-only dump). Use --source=ciqual explicitly.
  const sources: FoodSource[] =
    source === "all" ? ["frida"] : [source];

  for (const s of sources) {
    if (download) {
      await ensureDumpDownloaded(s);
    }
    const result = await importSource(s);
    if (result) {
      console.log(
        `Upserted ${result.rowCount} ${s} rows (v${result.sourceVersion}, run #${result.importRunId})`,
      );
    }
  }
}

main()
  .then(() => {
    console.log("Foods import finished");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
