import {
  RECIPE_CATEGORIES,
  RECIPE_DIFFICULTIES,
  RECIPE_UNITS,
  RECIPE_VISIBILITIES,
  RecipeJsonEnvelopeSchema,
  recipeInputsToCollectionEnvelope,
  recipeInputToExportEnvelope,
  type RecipeInput,
  type RecipeJsonEnvelope,
} from "./schemas";

/**
 * Every field export writes and import accepts.
 * When the recipe JSON shape changes, update this object in the same change
 * so `GET /api/recipes/format` stays the current document. See AGENTS.md.
 */
const recipeFormatInput = {
  name: "Spaghetti Carbonara",
  description: "Classic Roman pasta.",
  category: "main",
  difficulty: "medium",
  cuisine: "Italian",
  prepTimeMinutes: 15,
  cookTimeMinutes: 20,
  servings: 4,
  imageUrl: "https://example.com/carbonara.jpg",
  notes: "Use guanciale if available.",
  sourceUrl: "https://example.com/source",
  visibility: "private",
  ingredients: [
    { name: "Spaghetti", amount: "400", unit: "g" },
    { name: "Guanciale", amount: "150", unit: "g" },
    { name: "Pecorino Romano", amount: "100", unit: "g" },
    { name: "Eggs", amount: "4", unit: "piece" },
    { name: "Black pepper", amount: "1", unit: "tsp" },
  ],
  steps: [
    { instruction: "Boil pasta in salted water until al dente." },
    { instruction: "Crisp guanciale; reserve the fat." },
    { instruction: "Whisk eggs with pecorino and pepper." },
    { instruction: "Toss hot pasta with fat, then egg mixture off heat." },
  ],
  nutrition: {
    caloriesKcal: 720,
    proteinG: 28,
    carbsG: 74,
    fatG: 32,
  },
} satisfies RecipeInput;

const EXPORTED_AT = "2026-05-24T12:00:00.000Z";

function singleEnvelope(): RecipeJsonEnvelope {
  return RecipeJsonEnvelopeSchema.parse({
    ...recipeInputToExportEnvelope(recipeFormatInput),
    exportedAt: EXPORTED_AT,
  });
}

function collectionEnvelope() {
  return {
    ...recipeInputsToCollectionEnvelope([recipeFormatInput]),
    exportedAt: EXPORTED_AT,
  };
}

/** Canonical recipe JSON: the files export writes and import reads. */
export const recipeFormatDocument = {
  single: singleEnvelope(),
  collection: collectionEnvelope(),
  values: {
    category: RECIPE_CATEGORIES,
    difficulty: RECIPE_DIFFICULTIES,
    visibility: RECIPE_VISIBILITIES,
    unit: RECIPE_UNITS,
  },
  import: {
    singleFile:
      "A nexelon-recipe envelope, or the recipe object by itself (no envelope).",
    sortOrder:
      "Ingredients and steps may include an optional integer sortOrder. Import keeps it.",
  },
};
