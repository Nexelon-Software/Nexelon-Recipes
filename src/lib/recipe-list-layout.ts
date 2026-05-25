export const RECIPE_LIST_LAYOUT_STORAGE_KEY = "nexelon-recipes-list-layout";

export const DEFAULT_RECIPE_LIST_LAYOUT = "grid" as const;

export const RECIPE_LIST_LAYOUTS = [
  { id: "grid" },
  { id: "list" },
  { id: "compact" },
  { id: "table" },
] as const;

export type RecipeListLayoutId = (typeof RECIPE_LIST_LAYOUTS)[number]["id"];

const layoutIds = new Set<string>(RECIPE_LIST_LAYOUTS.map((l) => l.id));

export function isRecipeListLayoutId(value: string): value is RecipeListLayoutId {
  return layoutIds.has(value);
}

export function readStoredRecipeListLayout(): RecipeListLayoutId | null {
  try {
    const stored = localStorage.getItem(RECIPE_LIST_LAYOUT_STORAGE_KEY);
    if (stored && isRecipeListLayoutId(stored)) {
      return stored;
    }
  } catch {
    // private mode / blocked storage
  }
  return null;
}

export function writeStoredRecipeListLayout(id: RecipeListLayoutId): void {
  try {
    localStorage.setItem(RECIPE_LIST_LAYOUT_STORAGE_KEY, id);
  } catch {
    // private mode / blocked storage
  }
}
