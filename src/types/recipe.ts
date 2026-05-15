import recipesData from "~/app/assets/recipes.json";

export type RecipeCategory =
  | "main"
  | "side"
  | "sauce"
  | "dessert"
  | "soup"
  | "salad"
  | "dough"
  | "drinky";

export type RecipeDifficulty = "easy" | "medium" | "hard";

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
}

export interface Recipe {
  id: string;
  name: string;
  owner: string;
  description: string;
  category: RecipeCategory;
  tags: string[];
  relatedRecipes: string[];
  cuisine: string;
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  totalTimeMinutes: number | null;
  difficulty: RecipeDifficulty | null;
  ovenTemperatureCelsius: number | null;
  equipment: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  sourceUrl: string | null;
  references: string[];
  notes: string | null;
  imageUrl: string | null;
}

export const RECIPE_CATEGORIES: RecipeCategory[] = [
  "main",
  "side",
  "sauce",
  "dessert",
  "soup",
  "salad",
  "dough",
  "drinky",
];

export const RECIPE_DIFFICULTIES: RecipeDifficulty[] = [
  "easy",
  "medium",
  "hard",
];

export function getAllRecipes(): Recipe[] {
  return (recipesData as { recipes: Recipe[] }).recipes;
}

export function getRecipeById(id: string): Recipe | undefined {
  return getAllRecipes().find((recipe) => recipe.id === id);
}

export function getUniqueCuisines(): string[] {
  const set = new Set<string>();
  for (const recipe of getAllRecipes()) {
    if (recipe.cuisine) set.add(recipe.cuisine);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "sk"));
}

export function formatMinutes(
  minutes: number | null | undefined,
  fallback = "—",
): string {
  if (minutes === null || minutes === undefined) return fallback;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} h`;
  return `${hours} h ${remaining} min`;
}

export function getDifficultyColor(
  difficulty: RecipeDifficulty | null | undefined,
): string {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-500";
    case "medium":
      return "bg-amber-500";
    case "hard":
      return "bg-rose-500";
    default:
      return "bg-muted-foreground/40";
  }
}
