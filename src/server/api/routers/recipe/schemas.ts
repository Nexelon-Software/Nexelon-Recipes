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
  ingredients: z.array(IngredientLineSchema).min(1),
  steps: z.array(StepLineSchema).min(1),
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

export function recipeDetailToRecipeInput(
  recipe: RecipeDetailForInput,
): RecipeInput {
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
  };
}

export function recipeInputToExportEnvelope(
  input: RecipeInput,
): RecipeJsonEnvelope {
  return {
    format: RECIPE_JSON_FORMAT,
    version: RECIPE_JSON_VERSION,
    exportedAt: new Date().toISOString(),
    recipe: {
      ...input,
      ingredients: input.ingredients.map(({ name, amount, unit }) => ({
        name,
        ...(amount !== undefined ? { amount } : {}),
        ...(unit !== undefined ? { unit } : {}),
      })),
      steps: input.steps.map(({ instruction }) => ({ instruction })),
    },
  };
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
