/**
 * Parse ANSES-CIQUAL Excel food composition table.
 * License: etalab 2.0 — https://doi.org/10.57745/rdmhwy
 */
import { readFileSync } from "node:fs";

import * as XLSX from "xlsx";

import {
  cellString,
  hasUsableMacros,
  parseNutrientNumber,
  type NormalizedFood,
} from "./types";

const CIQUAL_VERSION = "2025";

type SheetRow = Record<string, unknown>;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumn(
  headers: string[],
  predicates: Array<(h: string) => boolean>,
): string | undefined {
  for (const pred of predicates) {
    const hit = headers.find(pred);
    if (hit) return hit;
  }
  return undefined;
}

function pickSheet(workbook: XLSX.WorkBook): XLSX.WorkSheet {
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null });
    if (rows.length === 0) continue;
    const headers = Object.keys(rows[0]!).map(normalizeHeader);
    if (
      headers.some((h) => h.includes("alim_code")) ||
      headers.some((h) => h.includes("alim_nom"))
    ) {
      return sheet;
    }
  }
  const first = workbook.Sheets[workbook.SheetNames[0]!];
  if (!first) {
    throw new Error("CIQUAL workbook has no sheets");
  }
  return first;
}

export function parseCiqualFile(filePath: string): NormalizedFood[] {
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = pickSheet(workbook);
  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null });
  if (rows.length === 0) {
    throw new Error(`CIQUAL file is empty: ${filePath}`);
  }

  const headerMap = new Map<string, string>();
  for (const key of Object.keys(rows[0]!)) {
    headerMap.set(normalizeHeader(key), key);
  }
  const headers = [...headerMap.keys()];

  const codeKey = headerMap.get(
    findColumn(headers, [
      (h) => h === "alim_code",
      (h) => h.includes("alim_code"),
    ]) ?? "",
  );
  const nameFrKey = headerMap.get(
    findColumn(headers, [
      (h) => h === "alim_nom_fr",
      (h) => h.includes("alim_nom_fr"),
    ]) ?? "",
  );
  const nameEnKey = headerMap.get(
    findColumn(headers, [
      (h) => h === "alim_nom_eng",
      (h) => h.includes("alim_nom_eng"),
      (h) => h.includes("alim_nom_en"),
    ]) ?? "",
  );
  const groupKey = headerMap.get(
    findColumn(headers, [
      (h) => h === "alim_grp_nom_fr",
      (h) => h === "alim_grp_nom_eng",
      (h) => h.includes("alim_grp_nom"),
    ]) ?? "",
  );

  const energyKey = headerMap.get(
    findColumn(headers, [
      (h) => h.includes("1169") && h.includes("kcal"),
      (h) => h.includes("energie") && h.includes("kcal"),
      (h) => h.includes("energy") && h.includes("kcal"),
    ]) ?? "",
  );
  const proteinKey = headerMap.get(
    findColumn(headers, [
      (h) => h.includes("proteines brutes") || h.includes("protéines brutes"),
      (h) =>
        (h.includes("proteine") || h.includes("protéine") || h.includes("protein")) &&
        h.includes("6.25"),
      (h) =>
        (h.startsWith("proteines") ||
          h.startsWith("protéines") ||
          h.startsWith("protein")) &&
        h.includes("g/100"),
    ]) ?? "",
  );
  const carbsKey = headerMap.get(
    findColumn(headers, [
      (h) =>
        (h.startsWith("glucides") || h.startsWith("carbohydrate")) &&
        !h.includes("disponible") &&
        h.includes("g/100"),
      (h) => h === "glucides (g/100g)" || h === "carbohydrate (g/100g)",
    ]) ?? "",
  );
  const fatKey = headerMap.get(
    findColumn(headers, [
      (h) =>
        (h.startsWith("lipides") || h.startsWith("fat")) &&
        !h.includes("acide") &&
        h.includes("g/100"),
      (h) => h === "lipides (g/100g)" || h === "fat (g/100g)",
    ]) ?? "",
  );

  if (!codeKey) {
    throw new Error(
      "CIQUAL: could not find alim_code column. Check the dump format.",
    );
  }
  if (!nameFrKey && !nameEnKey) {
    throw new Error(
      "CIQUAL: could not find alim_nom_fr / alim_nom_eng column.",
    );
  }

  const foods: NormalizedFood[] = [];
  for (const row of rows) {
    const externalId = cellString(row[codeKey]);
    if (!externalId) continue;

    const nameFr = nameFrKey ? cellString(row[nameFrKey]) : null;
    const nameEn = nameEnKey ? cellString(row[nameEnKey]) : null;
    const name = nameFr ?? nameEn;
    if (!name) continue;

    const food: NormalizedFood = {
      source: "ciqual",
      externalId,
      sourceVersion: CIQUAL_VERSION,
      name,
      nameEn: nameEn && nameEn !== name ? nameEn : nameEn,
      language: nameFr ? "fr" : "en",
      foodGroup: groupKey ? cellString(row[groupKey]) : null,
      caloriesKcalPer100g: energyKey
        ? parseNutrientNumber(row[energyKey])
        : null,
      proteinGPer100g: proteinKey
        ? parseNutrientNumber(row[proteinKey])
        : null,
      carbsGPer100g: carbsKey ? parseNutrientNumber(row[carbsKey]) : null,
      fatGPer100g: fatKey ? parseNutrientNumber(row[fatKey]) : null,
    };

    if (!hasUsableMacros(food)) continue;
    foods.push(food);
  }

  return foods;
}
