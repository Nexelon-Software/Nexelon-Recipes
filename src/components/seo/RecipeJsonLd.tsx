import type { Recipe } from "~/types/recipe";
import { absoluteUrl, localePath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";

function minutesToIsoDuration(minutes: number | null | undefined): string | undefined {
  if (minutes == null || minutes <= 0) return undefined;
  return `PT${minutes}M`;
}

function formatIngredient(ingredient: Recipe["ingredients"][number]): string {
  const parts: string[] = [];
  if (ingredient.quantity != null) {
    parts.push(String(ingredient.quantity));
  }
  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }
  parts.push(ingredient.name);
  if (ingredient.notes) {
    parts.push(`(${ingredient.notes})`);
  }
  return parts.join(" ").trim();
}

export function RecipeJsonLd({
  recipe,
  lang,
}: {
  recipe: Recipe;
  lang: Locale;
}) {
  const url = absoluteUrl(localePath(lang, `/recipes/${recipe.id}`));

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    description: recipe.description,
    url,
    author: {
      "@type": "Person",
      name: recipe.owner,
    },
    recipeCategory: recipe.category,
    recipeCuisine: recipe.cuisine || undefined,
    recipeYield: recipe.servings != null ? `${recipe.servings} servings` : undefined,
    prepTime: minutesToIsoDuration(recipe.prepTimeMinutes),
    cookTime: minutesToIsoDuration(recipe.cookTimeMinutes),
    totalTime: minutesToIsoDuration(recipe.totalTimeMinutes),
    recipeIngredient: recipe.ingredients.map(formatIngredient),
    recipeInstructions: recipe.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: step,
    })),
    keywords: recipe.tags.length > 0 ? recipe.tags.join(", ") : undefined,
  };

  if (recipe.imageUrl) {
    schema.image = absoluteUrl(recipe.imageUrl);
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
