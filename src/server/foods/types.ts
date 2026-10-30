/**
 * Shared types for Frida / CIQUAL food composition import.
 *
 * Attribution:
 * - CIQUAL: ANSES (etalab 2.0)
 * - Frida: DTU National Food Institute (CC-BY 4.0)
 */

export type FoodSource = "ciqual" | "frida";

export type NormalizedFood = {
  source: FoodSource;
  externalId: string;
  sourceVersion: string;
  name: string;
  nameEn: string | null;
  language: string;
  foodGroup: string | null;
  caloriesKcalPer100g: number | null;
  proteinGPer100g: number | null;
  carbsGPer100g: number | null;
  fatGPer100g: number | null;
};

export function hasUsableMacros(food: NormalizedFood): boolean {
  return (
    food.caloriesKcalPer100g !== null ||
    food.proteinGPer100g !== null ||
    food.carbsGPer100g !== null ||
    food.fatGPer100g !== null
  );
}

function asCellText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "bigint") return value.toString();
  return null;
}

/** Parse CIQUAL/Frida cell values; treat missing / "-" / "< x" as null. */
export function parseNutrientNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const raw = asCellText(value)?.trim();
  if (!raw || raw === "-" || raw === "—" || raw.toLowerCase() === "na") {
    return null;
  }
  // Upper limits like "< 0.5" — treat as unknown for cache accuracy.
  if (raw.startsWith("<") || raw.startsWith(">")) return null;
  const normalized = raw.replace(",", ".").replace(/\s/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function cellString(value: unknown): string | null {
  const s = asCellText(value)?.trim();
  return s && s.length > 0 ? s : null;
}
