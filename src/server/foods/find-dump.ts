import { readdirSync } from "node:fs";
import { join } from "node:path";

import type { FoodSource } from "./types";

export const RAW_DIR = join(process.cwd(), "data", "foods", "raw");

const SOURCE_HINT: Record<FoodSource, RegExp> = {
  ciqual: /ciqual/i,
  frida: /frida/i,
};

/**
 * Resolve dump path: prefer exact `ciqual.xlsx` / `frida.xlsx`, else first
 * matching `*ciqual*.xlsx` / `*frida*.xlsx` (also `.xls`).
 */
export function findDumpFile(source: FoodSource): string {
  let entries: string[];
  try {
    entries = readdirSync(RAW_DIR);
  } catch {
    throw new Error(
      `Missing dump directory ${RAW_DIR}. Create it and add ${source}.xlsx — see data/foods/README.md`,
    );
  }

  const preferred = [`${source}.xlsx`, `${source}.xls`];
  for (const name of preferred) {
    if (entries.includes(name)) {
      return join(RAW_DIR, name);
    }
  }

  const hint = SOURCE_HINT[source];
  const match = entries.find(
    (name) => hint.test(name) && /\.xlsx?$/i.test(name),
  );
  if (match) {
    return join(RAW_DIR, match);
  }

  throw new Error(
    `No ${source} dump found in ${RAW_DIR}. Expected ${source}.xlsx — see data/foods/README.md`,
  );
}
