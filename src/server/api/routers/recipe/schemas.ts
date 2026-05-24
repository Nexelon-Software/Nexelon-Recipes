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
