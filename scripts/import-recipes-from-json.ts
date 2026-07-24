/**
 * One-off import: legacy `src/app/assets/recipes.json` → PostgreSQL.
 *
 * Run from repo root (requires `.env` with DATABASE_URL and other env vars):
 *   npx tsx scripts/import-recipes-from-json.ts
 *
 * Delete this file after a successful import.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { and, eq } from "drizzle-orm";

import {
  RECIPE_CATEGORIES,
  RECIPE_DIFFICULTIES,
  RECIPE_UNITS,
  type RecipeUnit,
} from "~/server/api/routers/recipe/schemas";
import { db } from "~/server/db";
import {
  recipeIngredients,
  recipes,
  recipeSteps,
  user,
} from "~/server/db/schema";

const TARGET_EMAIL = "samuel.hrotik@gmail.com";
const MAX_VARCHAR_64 = 64;
const JSON_PATH = join(
  process.cwd(),
  "src/app/assets/recipes.json",
);

type LegacyIngredient = {
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
};

type LegacyRecipe = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  cuisine?: string | null;
  servings?: number | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  difficulty?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
  sourceUrl?: string | null;
  ingredients: LegacyIngredient[];
  steps: string[];
};

type LegacyFile = {
  recipes: LegacyRecipe[];
};

const LEGACY_UNIT_TO_DB: Record<string, RecipeUnit> = {
  ml: "ml",
  l: "l",
  dl: "dl",
  dcl: "dl",
  g: "g",
  kg: "kg",
  ks: "piece",
  tsp: "tsp",
  tbsp: "tbsp",
  piece: "piece",
  head: "head",
};

function mapUnit(unit: string | null): string | undefined {
  if (!unit) return undefined;
  const mapped = LEGACY_UNIT_TO_DB[unit];
  if (mapped) return mapped;
  if (RECIPE_UNITS.includes(unit as RecipeUnit)) return unit;
  return unit;
}

function clampVarchar(
  value: string | undefined,
  maxLen: number,
): string | undefined {
  if (!value) return undefined;
  return value.length <= maxLen ? value : value.slice(0, maxLen);
}

function formatAmount(
  quantity: number | null,
  notes: string | null,
): string | undefined {
  const parts: string[] = [];
  if (quantity != null) parts.push(String(quantity));
  if (notes?.trim()) parts.push(notes.trim());
  const combined = parts.length > 0 ? parts.join(" — ") : undefined;
  return clampVarchar(combined, MAX_VARCHAR_64);
}

function positiveMinutes(value: number | null | undefined): number | undefined {
  if (value == null || value <= 0) return undefined;
  return value;
}

function mapCategory(
  category: string | null | undefined,
): (typeof RECIPE_CATEGORIES)[number] | undefined {
  if (!category) return undefined;
  return RECIPE_CATEGORIES.includes(category as (typeof RECIPE_CATEGORIES)[number])
    ? (category as (typeof RECIPE_CATEGORIES)[number])
    : undefined;
}

function mapDifficulty(
  difficulty: string | null | undefined,
): (typeof RECIPE_DIFFICULTIES)[number] | undefined {
  if (!difficulty) return undefined;
  return RECIPE_DIFFICULTIES.includes(
    difficulty as (typeof RECIPE_DIFFICULTIES)[number],
  )
    ? (difficulty as (typeof RECIPE_DIFFICULTIES)[number])
    : undefined;
}

function mapIngredients(legacy: LegacyIngredient[]) {
  if (legacy.length === 0) {
    return [{ name: "—", amount: undefined, unit: undefined, sortOrder: 0 }];
  }

  return legacy.map((ingredient, index) => ({
    name: ingredient.name,
    amount: formatAmount(ingredient.quantity, ingredient.notes),
    unit: clampVarchar(mapUnit(ingredient.unit), MAX_VARCHAR_64),
    sortOrder: index,
  }));
}

function mapSteps(legacy: string[]) {
  const trimmed = legacy.map((step) => step.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return [{ instruction: "—", sortOrder: 0 }];
  }
  return trimmed.map((instruction, index) => ({ instruction, sortOrder: index }));
}

async function main() {
  const raw = readFileSync(JSON_PATH, "utf8");
  const file = JSON.parse(raw) as LegacyFile;
  const legacyRecipes = file.recipes;

  const [owner] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, TARGET_EMAIL))
    .limit(1);

  if (!owner) {
    console.error(
      `No user with email ${TARGET_EMAIL}. Sign in with Google first, then re-run.`,
    );
    process.exit(1);
  }

  const existing = await db
    .select({ name: recipes.name })
    .from(recipes)
    .where(
      and(eq(recipes.createdById, owner.id), eq(recipes.deleted, false)),
    );

  const existingNames = new Set(
    existing.map((row) => row.name.trim().toLocaleLowerCase()),
  );

  let inserted = 0;
  let skipped = 0;

  for (const legacy of legacyRecipes) {
    const nameKey = legacy.name.trim().toLocaleLowerCase();
    if (existingNames.has(nameKey)) {
      console.log(`skip (exists): ${legacy.name}`);
      skipped += 1;
      continue;
    }

    const ingredients = mapIngredients(legacy.ingredients);
    const steps = mapSteps(legacy.steps);

    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(recipes)
        .values({
          name: legacy.name,
          description: legacy.description ?? null,
          category: mapCategory(legacy.category) ?? null,
          cuisine: legacy.cuisine ?? null,
          difficulty: mapDifficulty(legacy.difficulty) ?? null,
          prepTimeMinutes: positiveMinutes(legacy.prepTimeMinutes),
          cookTimeMinutes: positiveMinutes(legacy.cookTimeMinutes),
          servings:
            legacy.servings != null && legacy.servings > 0
              ? legacy.servings
              : null,
          imageUrl: legacy.imageUrl ?? null,
          notes: legacy.notes ?? null,
          sourceUrl: legacy.sourceUrl ?? null,
          createdById: owner.id,
        })
        .returning({ id: recipes.id });

      if (!created) {
        throw new Error(`Failed to insert recipe: ${legacy.name}`);
      }

      await tx.insert(recipeIngredients).values(
        ingredients.map((ingredient) => ({
          recipeId: created.id,
          name: ingredient.name,
          amount: ingredient.amount ?? null,
          unit: ingredient.unit ?? null,
          sortOrder: ingredient.sortOrder,
        })),
      );

      await tx.insert(recipeSteps).values(
        steps.map((step) => ({
          recipeId: created.id,
          instruction: step.instruction,
          sortOrder: step.sortOrder,
        })),
      );
    });

    existingNames.add(nameKey);
    console.log(`inserted: ${legacy.name}`);
    inserted += 1;
  }

  console.log(
    `\nDone. ${inserted} inserted, ${skipped} skipped (${legacyRecipes.length} in JSON).`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
