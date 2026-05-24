import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const langDir = path.join(root, "src/language/lang");
const enPath = path.join(langDir, "en.json");
const skPath = path.join(langDir, "sk.json");
const langMapsPath = path.join(root, "src/language/langMaps.ts");

function buildLangMaps(obj, prefix = "") {
  /** @type {Record<string, string | Record<string, unknown>>} */
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    const dotKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      result[key] = dotKey;
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = buildLangMaps(value, dotKey);
    }
  }

  return result;
}

function stringifyLangMaps(obj, indent = 2) {
  const pad = " ".repeat(indent);
  const innerPad = " ".repeat(indent + 2);

  const lines = Object.entries(obj).map(([key, value]) => {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);

    if (typeof value === "string") {
      return `${innerPad}${safeKey}: ${JSON.stringify(value)},`;
    }

    return `${innerPad}${safeKey}: ${stringifyLangMaps(value, indent + 2)},`;
  });

  return `{\n${lines.join("\n")}\n${pad}}`;
}

function syncLocaleStructure(source, target) {
  /** @type {Record<string, unknown>} */
  const result = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = target[key];

    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue)
    ) {
      result[key] = syncLocaleStructure(
        sourceValue,
        targetValue && typeof targetValue === "object" && !Array.isArray(targetValue)
          ? targetValue
          : {},
      );
      continue;
    }

    if (targetValue === undefined) {
      result[key] = sourceValue;
    }
  }

  return result;
}

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const sk = JSON.parse(fs.readFileSync(skPath, "utf8"));
const syncedSk = syncLocaleStructure(en, sk);

const langMaps = buildLangMaps(en);
const langMapsSource = `export const langMaps = ${stringifyLangMaps(langMaps, 0)} as const;

export type LangMapType = typeof langMaps;
`;

fs.writeFileSync(langMapsPath, langMapsSource);
fs.writeFileSync(skPath, `${JSON.stringify(syncedSk, null, 2)}\n`);

console.log("Generated src/language/langMaps.ts");
console.log("Synced src/language/lang/sk.json structure with en.json");
