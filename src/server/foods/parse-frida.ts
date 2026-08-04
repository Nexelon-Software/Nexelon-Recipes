/**
 * Parse DTU Frida food composition spreadsheet.
 * License: CC-BY 4.0 — https://doi.org/10.11583/dtu.29500682
 *
 * Sheets used: Food (+ optional FoodGroup), Data_Table / Data_Normalised,
 * Parameter (to resolve nutrient ParameterIDs by name).
 */
import { readFileSync } from "node:fs";

import * as XLSX from "xlsx";

import {
  cellString,
  hasUsableMacros,
  parseNutrientNumber,
  type NormalizedFood,
} from "./types";

const FRIDA_VERSION = "5.5";

/** Fallback ParameterIDs from Frida 5.x docs when Parameter sheet is missing. */
const FALLBACK_PARAMETER_IDS: {
  energyKcal: number;
  protein: number;
  fat: number;
  carbs: number;
} = {
  energyKcal: 356,
  protein: 218,
  fat: 141,
  carbs: 172, // Available carbohydrate
};

type SheetRow = Record<string, unknown>;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function sheetByName(
  workbook: XLSX.WorkBook,
  candidates: string[],
): XLSX.WorkSheet | undefined {
  const names = workbook.SheetNames;
  for (const candidate of candidates) {
    const found = names.find(
      (n) => n.trim().toLowerCase() === candidate.toLowerCase(),
    );
    if (found && workbook.Sheets[found]) {
      return workbook.Sheets[found];
    }
  }
  // Partial match
  for (const candidate of candidates) {
    const found = names.find((n) =>
      n.trim().toLowerCase().includes(candidate.toLowerCase()),
    );
    if (found && workbook.Sheets[found]) {
      return workbook.Sheets[found];
    }
  }
  return undefined;
}

function rowsOf(sheet: XLSX.WorkSheet): SheetRow[] {
  return XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null });
}

function pickKey(
  sample: SheetRow,
  predicates: Array<(h: string) => boolean>,
): string | undefined {
  const entries = Object.keys(sample).map((key) => ({
    key,
    norm: normalizeHeader(key),
  }));
  for (const pred of predicates) {
    const hit = entries.find((e) => pred(e.norm));
    if (hit) return hit.key;
  }
  return undefined;
}

function resolveParameterIds(
  workbook: XLSX.WorkBook,
): typeof FALLBACK_PARAMETER_IDS {
  const sheet = sheetByName(workbook, ["Parameter", "Parameters"]);
  if (!sheet) return { ...FALLBACK_PARAMETER_IDS };

  const rows = rowsOf(sheet);
  if (rows.length === 0) return { ...FALLBACK_PARAMETER_IDS };

  const idKey = pickKey(rows[0]!, [
    (h) => h === "parameterid",
    (h) => h === "parameter_id",
    (h) => h.includes("parameter") && h.includes("id"),
  ]);
  const nameKey = pickKey(rows[0]!, [
    (h) => h === "parametername",
    (h) => h === "parameter_name",
    (h) => h === "name",
    (h) => h.includes("parameter") && h.includes("name"),
  ]);
  if (!idKey || !nameKey) return { ...FALLBACK_PARAMETER_IDS };

  const byName = new Map<string, number>();
  for (const row of rows) {
    const id = parseNutrientNumber(row[idKey]);
    const name = cellString(row[nameKey])?.toLowerCase();
    if (id === null || !name) continue;
    byName.set(name, id);
  }

  const findId = (
    exact: string[],
    includes: string[],
    excludes: string[] = [],
  ): number | undefined => {
    for (const e of exact) {
      const id = byName.get(e.toLowerCase());
      if (id !== undefined) return id;
    }
    for (const [name, id] of byName) {
      if (excludes.some((part) => name.includes(part))) continue;
      if (includes.length > 0 && includes.every((part) => name.includes(part))) {
        return id;
      }
    }
    return undefined;
  };

  return {
    energyKcal:
      findId(
        ["energy (kcal)", "energy, kcal"],
        ["energy", "kcal"],
        ["labelling", "labeling", "kj"],
      ) ?? FALLBACK_PARAMETER_IDS.energyKcal,
    protein:
      findId(["protein"], [], ["label", "amino"]) ??
      FALLBACK_PARAMETER_IDS.protein,
    fat:
      findId(["fat"], ["fat"], ["fatty", "acid", "saturat"]) ??
      FALLBACK_PARAMETER_IDS.fat,
    carbs:
      findId(
        [
          "carbohydrate by difference",
          "available carbohydrates",
          "available carbohydrate",
        ],
        ["available", "carbohydrate"],
        ["label"],
      ) ?? FALLBACK_PARAMETER_IDS.carbs,
  };
}

export function parseFridaFile(filePath: string): NormalizedFood[] {
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const foodSheet = sheetByName(workbook, ["Food", "Foods"]);
  // Frida 5.x: Data_Table is a wide pivot; long FoodID/ParameterID/ResVal
  // rows live on Data_Normalised. Prefer that sheet.
  const dataSheet = sheetByName(workbook, [
    "Data_Normalised",
    "Data_Table",
    "Data",
  ]);
  if (!foodSheet) {
    throw new Error("Frida: missing Food sheet");
  }
  if (!dataSheet) {
    throw new Error("Frida: missing Data_Normalised / Data_Table sheet");
  }

  const foodRows = rowsOf(foodSheet);
  const dataRows = rowsOf(dataSheet);
  if (foodRows.length === 0 || dataRows.length === 0) {
    throw new Error(`Frida file has empty Food or Data sheet: ${filePath}`);
  }

  const foodIdKey = pickKey(foodRows[0]!, [
    (h) => h === "foodid",
    (h) => h === "food_id",
    (h) => h === "food id",
    (h) => h === "id",
  ]);
  // Danish primary name (FødevareNavn); English in FoodName.
  const nameKey = pickKey(foodRows[0]!, [
    (h) => h === "fødevarenavn" || h === "fodevarenavn",
    (h) => h === "foodname_dk",
    (h) => h === "food_name",
    (h) => h === "foodname",
    (h) => h === "name",
    (h) => h.includes("food") && h.includes("name") && !h.endsWith("en"),
  ]);
  const nameEnKey = pickKey(foodRows[0]!, [
    (h) => h === "foodname",
    (h) => h === "foodname_en",
    (h) => h === "food_name_en",
    (h) => h === "name_en",
    (h) => h === "english name",
    (h) => h.includes("food") && h.includes("name") && h.includes("en"),
  ]);
  const groupKey = pickKey(foodRows[0]!, [
    (h) => h === "foodgroup",
    (h) => h === "food_group",
    (h) => h === "fødevaregruppe" || h === "fodevaregruppe",
    (h) => h === "foodgroupid",
    (h) => h.includes("foodgroup") || h.includes("food group"),
  ]);

  if (!foodIdKey || !nameKey) {
    throw new Error(
      "Frida: could not find FoodID / FoodName columns on Food sheet",
    );
  }

  const dataSampleKeys = Object.keys(dataRows[0] ?? {}).map(normalizeHeader);
  const looksLongFormat =
    dataSampleKeys.some((h) => h === "foodid" || h === "food_id") &&
    dataSampleKeys.some((h) => h.includes("parameter") && h.includes("id"));

  if (!looksLongFormat) {
    throw new Error(
      "Frida: selected data sheet is not long-format (need Data_Normalised with FoodID/ParameterID/ResVal)",
    );
  }

  const dataFoodIdKey = pickKey(dataRows[0]!, [
    (h) => h === "foodid",
    (h) => h === "food_id",
    (h) => h === "food id",
  ]);
  const paramIdKey = pickKey(dataRows[0]!, [
    (h) => h === "parameterid",
    (h) => h === "parameter_id",
    (h) => h.includes("parameter") && h.includes("id"),
  ]);
  const valueKey = pickKey(dataRows[0]!, [
    (h) => h === "resval",
    (h) => h === "value",
    (h) => h === "mean",
    (h) => h === "content",
    (h) => h.includes("res"),
  ]);

  if (!dataFoodIdKey || !paramIdKey || !valueKey) {
    throw new Error(
      "Frida: could not find FoodID / ParameterID / value columns on Data sheet",
    );
  }

  const paramIds = resolveParameterIds(workbook);
  const wanted = new Set<number>(Object.values(paramIds));

  // foodId -> parameterId -> value
  const nutrients = new Map<string, Map<number, number>>();
  for (const row of dataRows) {
    const foodId = cellString(row[dataFoodIdKey]);
    const parameterId = parseNutrientNumber(row[paramIdKey]);
    if (!foodId || parameterId === null || !wanted.has(parameterId)) continue;
    const value = parseNutrientNumber(row[valueKey]);
    if (value === null) continue;
    let byParam = nutrients.get(foodId);
    if (!byParam) {
      byParam = new Map();
      nutrients.set(foodId, byParam);
    }
    byParam.set(parameterId, value);
  }

  const foods: NormalizedFood[] = [];
  for (const row of foodRows) {
    const externalId = cellString(row[foodIdKey]);
    const name = cellString(row[nameKey]);
    if (!externalId || !name) continue;

    const nameEn = nameEnKey ? cellString(row[nameEnKey]) : null;
    const byParam = nutrients.get(externalId);

    const food: NormalizedFood = {
      source: "frida",
      externalId,
      sourceVersion: FRIDA_VERSION,
      name,
      nameEn: nameEn && nameEn !== name ? nameEn : nameEn,
      language: "da",
      foodGroup: groupKey ? cellString(row[groupKey]) : null,
      caloriesKcalPer100g: byParam?.get(paramIds.energyKcal) ?? null,
      proteinGPer100g: byParam?.get(paramIds.protein) ?? null,
      carbsGPer100g: byParam?.get(paramIds.carbs) ?? null,
      fatGPer100g: byParam?.get(paramIds.fat) ?? null,
    };

    if (!hasUsableMacros(food)) continue;
    foods.push(food);
  }

  return foods;
}
