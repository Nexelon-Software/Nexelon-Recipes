import { z } from "zod";

export const RECIPE_CATEGORIES = [
  "main",
  "side",
  "sauce",
  "dessert",
  "soup",
  "salad",
  "dough",
  "drinky",
] as const;

export const RECIPE_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const RECIPE_VISIBILITIES = ["private", "public"] as const;

export type RecipeVisibility = (typeof RECIPE_VISIBILITIES)[number];

export const RECIPE_UNITS = [
  "ml",
  "l",
  "dl",
  "tsp",
  "tbsp",
  "g",
  "kg",
  "piece",
  "head",
] as const;

export type RecipeUnit = (typeof RECIPE_UNITS)[number];

export const IngredientLineSchema = z.object({
  name: z.string().min(1),
  amount: z.string().optional(),
  unit: z.enum(RECIPE_UNITS).optional(),
  sortOrder: z.number().int().optional(),
});

export const StepLineSchema = z.object({
  instruction: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

export const NutritionSchema = z.object({
  caloriesKcal: z.number().int().nonnegative().optional(),
  proteinG: z.number().int().nonnegative().optional(),
  carbsG: z.number().int().nonnegative().optional(),
  fatG: z.number().int().nonnegative().optional(),
});

export type NutritionInput = z.infer<typeof NutritionSchema>;

const optionalUrl = z
  .string()
  .url()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

export const RecipeInputSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().optional(),
  category: z.enum(RECIPE_CATEGORIES).optional(),
  difficulty: z.enum(RECIPE_DIFFICULTIES).optional(),
  cuisine: z.string().max(128).optional(),
  prepTimeMinutes: z.number().int().positive().optional(),
  cookTimeMinutes: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  imageUrl: optionalUrl,
  notes: z.string().optional(),
  sourceUrl: optionalUrl,
  visibility: z.enum(RECIPE_VISIBILITIES).default("private"),
  ingredients: z.array(IngredientLineSchema).min(1),
  steps: z.array(StepLineSchema).min(1),
  nutrition: NutritionSchema.optional(),
});

export type RecipeInput = z.infer<typeof RecipeInputSchema>;

export const RECIPE_JSON_FORMAT = "nexelon-recipe" as const;
export const RECIPE_JSON_VERSION = 1 as const;

export const RecipeJsonEnvelopeSchema = z.object({
  format: z.literal(RECIPE_JSON_FORMAT),
  version: z.literal(RECIPE_JSON_VERSION),
  exportedAt: z.string().datetime().optional(),
  recipe: RecipeInputSchema,
});

export type RecipeJsonEnvelope = z.infer<typeof RecipeJsonEnvelopeSchema>;

export type RecipeDetailForInput = {
  name: string;
  description: string | null;
  category: string | null;
  cuisine: string | null;
  difficulty: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  imageUrl: string | null;
  notes: string | null;
  sourceUrl: string | null;
  visibility: string | null;
  ingredients: Array<{
    name: string;
    amount: string | null;
    unit: string | null;
    sortOrder: number;
  }>;
  steps: Array<{
    instruction: string;
    sortOrder: number;
  }>;
  nutrition: {
    caloriesKcal: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  } | null;
};

export class RecipeJsonParseError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_json" | "validation_failed",
  ) {
    super(message);
    this.name = "RecipeJsonParseError";
  }
}

export function hasNutritionValues(
  nutrition:
    | {
        caloriesKcal?: number | null;
        proteinG?: number | null;
        carbsG?: number | null;
        fatG?: number | null;
      }
    | null
    | undefined,
): nutrition is {
  caloriesKcal?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
} {
  if (!nutrition) return false;
  return (
    nutrition.caloriesKcal != null ||
    nutrition.proteinG != null ||
    nutrition.carbsG != null ||
    nutrition.fatG != null
  );
}

function nutritionToInput(
  nutrition: RecipeDetailForInput["nutrition"],
): NutritionInput | undefined {
  if (!hasNutritionValues(nutrition) || !nutrition) return undefined;
  return {
    ...(nutrition.caloriesKcal != null
      ? { caloriesKcal: nutrition.caloriesKcal }
      : {}),
    ...(nutrition.proteinG != null ? { proteinG: nutrition.proteinG } : {}),
    ...(nutrition.carbsG != null ? { carbsG: nutrition.carbsG } : {}),
    ...(nutrition.fatG != null ? { fatG: nutrition.fatG } : {}),
  };
}

export function recipeDetailToRecipeInput(
  recipe: RecipeDetailForInput,
): RecipeInput {
  const nutrition = nutritionToInput(recipe.nutrition);
  return {
    name: recipe.name,
    description: recipe.description ?? undefined,
    category:
      recipe.category && RECIPE_CATEGORIES.includes(recipe.category as never)
        ? (recipe.category as RecipeInput["category"])
        : undefined,
    cuisine: recipe.cuisine ?? undefined,
    difficulty:
      recipe.difficulty &&
      RECIPE_DIFFICULTIES.includes(recipe.difficulty as never)
        ? (recipe.difficulty as RecipeInput["difficulty"])
        : undefined,
    prepTimeMinutes: recipe.prepTimeMinutes ?? undefined,
    cookTimeMinutes: recipe.cookTimeMinutes ?? undefined,
    servings: recipe.servings ?? undefined,
    imageUrl: recipe.imageUrl ?? undefined,
    notes: recipe.notes ?? undefined,
    sourceUrl: recipe.sourceUrl ?? undefined,
    visibility:
      recipe.visibility &&
      RECIPE_VISIBILITIES.includes(recipe.visibility as RecipeVisibility)
        ? (recipe.visibility as RecipeVisibility)
        : "private",
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount ?? undefined,
      unit:
        ingredient.unit &&
        RECIPE_UNITS.includes(ingredient.unit as RecipeUnit)
          ? (ingredient.unit as RecipeUnit)
          : undefined,
      sortOrder: ingredient.sortOrder,
    })),
    steps: recipe.steps.map((step) => ({
      instruction: step.instruction,
      sortOrder: step.sortOrder,
    })),
    ...(nutrition ? { nutrition } : {}),
  };
}

export function recipeInputToExportEnvelope(
  input: RecipeInput,
): RecipeJsonEnvelope {
  const nutrition = hasNutritionValues(input.nutrition)
    ? nutritionToInput({
        caloriesKcal: input.nutrition.caloriesKcal ?? null,
        proteinG: input.nutrition.proteinG ?? null,
        carbsG: input.nutrition.carbsG ?? null,
        fatG: input.nutrition.fatG ?? null,
      })
    : undefined;

  return {
    format: RECIPE_JSON_FORMAT,
    version: RECIPE_JSON_VERSION,
    exportedAt: new Date().toISOString(),
    recipe: {
      name: input.name,
      description: input.description,
      category: input.category,
      difficulty: input.difficulty,
      cuisine: input.cuisine,
      prepTimeMinutes: input.prepTimeMinutes,
      cookTimeMinutes: input.cookTimeMinutes,
      servings: input.servings,
      imageUrl: input.imageUrl,
      notes: input.notes,
      sourceUrl: input.sourceUrl,
      visibility: input.visibility,
      ingredients: input.ingredients.map(({ name, amount, unit }) => ({
        name,
        ...(amount !== undefined ? { amount } : {}),
        ...(unit !== undefined ? { unit } : {}),
      })),
      steps: input.steps.map(({ instruction }) => ({ instruction })),
      ...(nutrition ? { nutrition } : {}),
    },
  };
}

export const RECIPE_COLLECTION_JSON_FORMAT = "nexelon-recipes" as const;

export function recipeInputsToCollectionEnvelope(inputs: RecipeInput[]) {
  return {
    format: RECIPE_COLLECTION_JSON_FORMAT,
    version: RECIPE_JSON_VERSION,
    exportedAt: new Date().toISOString(),
    recipes: inputs.map(
      (input) => recipeInputToExportEnvelope(input).recipe,
    ),
  };
}

export function recipeInputsToMarkdown(
  inputs: RecipeInput[],
  collectionTitle: string,
): string {
  const parts: string[] = [`# ${collectionTitle}`, ""];

  if (inputs.length === 0) {
    parts.push("_No recipes._", "");
    return parts.join("\n");
  }

  for (const recipe of inputs) {
    parts.push(`## ${recipe.name}`, "");

    if (recipe.description?.trim()) {
      parts.push(recipe.description.trim(), "");
    }

    const meta: string[] = [];
    if (recipe.visibility) meta.push(`- **Visibility:** ${recipe.visibility}`);
    if (recipe.category) meta.push(`- **Category:** ${recipe.category}`);
    if (recipe.cuisine) meta.push(`- **Cuisine:** ${recipe.cuisine}`);
    if (recipe.difficulty) meta.push(`- **Difficulty:** ${recipe.difficulty}`);
    if (recipe.servings != null) {
      meta.push(`- **Servings:** ${recipe.servings}`);
    }
    if (recipe.prepTimeMinutes != null) {
      meta.push(`- **Prep:** ${recipe.prepTimeMinutes} min`);
    }
    if (recipe.cookTimeMinutes != null) {
      meta.push(`- **Cook:** ${recipe.cookTimeMinutes} min`);
    }
    if (recipe.sourceUrl) {
      meta.push(`- **Source:** ${recipe.sourceUrl}`);
    }
    if (meta.length > 0) {
      parts.push(...meta, "");
    }

    parts.push("### Ingredients", "");
    if (recipe.ingredients.length === 0) {
      parts.push("- _(none)_", "");
    } else {
      for (const ingredient of recipe.ingredients) {
        const qty = [ingredient.amount, ingredient.unit]
          .filter(Boolean)
          .join(" ");
        const line = qty
          ? `- ${qty} — ${ingredient.name}`
          : `- ${ingredient.name}`;
        parts.push(line);
      }
      parts.push("");
    }

    if (hasNutritionValues(recipe.nutrition)) {
      parts.push("### Nutrition (per serving)", "");
      if (recipe.nutrition?.caloriesKcal != null) {
        parts.push(`- **Calories:** ${recipe.nutrition.caloriesKcal} kcal`);
      }
      if (recipe.nutrition?.proteinG != null) {
        parts.push(`- **Protein:** ${recipe.nutrition.proteinG} g`);
      }
      if (recipe.nutrition?.carbsG != null) {
        parts.push(`- **Carbs:** ${recipe.nutrition.carbsG} g`);
      }
      if (recipe.nutrition?.fatG != null) {
        parts.push(`- **Fat:** ${recipe.nutrition.fatG} g`);
      }
      parts.push("");
    }

    parts.push("### Steps", "");
    if (recipe.steps.length === 0) {
      parts.push("1. _(none)_", "");
    } else {
      recipe.steps.forEach((step, index) => {
        parts.push(`${index + 1}. ${step.instruction}`);
      });
      parts.push("");
    }

    if (recipe.notes?.trim()) {
      parts.push("### Notes", "", recipe.notes.trim(), "");
    }

    parts.push("---", "");
  }

  return parts.join("\n").trimEnd() + "\n";
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

export function parseRecipeJsonFile(text: string): RecipeInput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new RecipeJsonParseError("Invalid JSON", "invalid_json");
  }

  const envelopeResult = RecipeJsonEnvelopeSchema.safeParse(parsed);
  if (envelopeResult.success) {
    return envelopeResult.data.recipe;
  }

  const bareResult = RecipeInputSchema.safeParse(parsed);
  if (bareResult.success) {
    return bareResult.data;
  }

  const issues = bareResult.error ?? envelopeResult.error;
  throw new RecipeJsonParseError(
    formatZodIssues(issues),
    "validation_failed",
  );
}
