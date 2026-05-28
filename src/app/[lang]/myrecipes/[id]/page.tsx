import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "~/components/ui/button";
import { localePath } from "~/lib/seo-url";
import { cn } from "~/lib/utils";
import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";
import {
  RECIPE_UNITS,
  recipeDetailToRecipeInput,
  type RecipeUnit,
} from "~/server/api/routers/recipe/schemas";
import { api } from "~/trpc/server";

import { DeleteRecipeButton } from "../_components/DeleteRecipeButton";
import { ExportRecipeButton } from "../_components/ExportRecipeButton";
import { RecipeDetailSectionCard } from "../_components/RecipeDetailSectionCard";
import { RecipesAppShell } from "../_components/RecipesAppShell";
import { getRecipesPageContext } from "../_lib/page-data";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langParam, id: idParam } = await params;
  const lang = langParam as Locale;
  const recipeId = Number(idParam);

  if (!Number.isInteger(recipeId) || recipeId <= 0) {
    notFound();
  }

  const { session, loginPath, imageUrl, userId } =
    await getRecipesPageContext(lang);

  if (!session?.user) {
    redirect(loginPath);
  }

  let recipe;
  try {
    recipe = await api.recipe.getById({ id: recipeId });
  } catch {
    notFound();
  }

  const langObj = await getLanguage(lang);
  const isOwner = userId === recipe.createdById;

  const formatIngredientUnit = (unit: string | null) => {
    if (!unit) return null;
    if (RECIPE_UNITS.includes(unit as RecipeUnit)) {
      return ts(
        langObj,
        langMaps.recipes.units[unit as RecipeUnit],
      );
    }
    return unit;
  };

  const ingredientColumns =
    recipe.ingredients.length <= 1
      ? [recipe.ingredients]
      : [
          recipe.ingredients.slice(
            0,
            Math.ceil(recipe.ingredients.length / 2),
          ),
          recipe.ingredients.slice(
            Math.ceil(recipe.ingredients.length / 2),
          ),
        ];

  return (
    <RecipesAppShell lang={lang} imageUrl={imageUrl}>
      <article className="container mx-auto max-w-5xl space-y-8 px-3 py-6 sm:px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              href={localePath(lang, "/myrecipes")}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "px-0",
              )}
            >
              ← {ts(langObj, langMaps.recipes.backToList)}
            </Link>
            <h1 className="text-3xl font-semibold">{recipe.name}</h1>
            {recipe.description ? (
              <p className="text-muted-foreground">{recipe.description}</p>
            ) : null}
          </div>
          {isOwner ? (
            <div className="flex flex-wrap gap-2">
              <ExportRecipeButton recipe={recipeDetailToRecipeInput(recipe)} />
              <Link
                href={localePath(lang, `/myrecipes/${recipe.id}/edit`)}
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              >
                {ts(langObj, langMaps.recipes.actions.edit)}
              </Link>
              <DeleteRecipeButton recipeId={recipe.id} />
            </div>
          ) : null}
        </div>

        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="border-border aspect-video w-full rounded-lg border object-cover"
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4">
          <RecipeDetailSectionCard
            title={ts(langObj, langMaps.recipes.detail.details)}
          >
            <dl className="grid grid-cols-2 gap-4">
              {recipe.category ? (
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {ts(langObj, langMaps.recipes.detail.category)}
                  </dt>
                  <dd>
                    {ts(
                      langObj,
                      langMaps.recipes.categories[
                        recipe.category as keyof typeof langMaps.recipes.categories
                      ],
                    )}
                  </dd>
                </div>
              ) : null}
              {recipe.difficulty ? (
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {ts(langObj, langMaps.recipes.detail.difficulty)}
                  </dt>
                  <dd>
                    {ts(
                      langObj,
                      langMaps.recipes.difficulties[
                        recipe.difficulty as keyof typeof langMaps.recipes.difficulties
                      ],
                    )}
                  </dd>
                </div>
              ) : null}
              {recipe.cuisine ? (
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {ts(langObj, langMaps.recipes.detail.cuisine)}
                  </dt>
                  <dd>{recipe.cuisine}</dd>
                </div>
              ) : null}
              {recipe.servings ? (
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {ts(langObj, langMaps.recipes.detail.servings)}
                  </dt>
                  <dd>{recipe.servings}</dd>
                </div>
              ) : null}
              {recipe.prepTimeMinutes ? (
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {ts(langObj, langMaps.recipes.detail.prepTime)}
                  </dt>
                  <dd>{recipe.prepTimeMinutes} min</dd>
                </div>
              ) : null}
              {recipe.cookTimeMinutes ? (
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {ts(langObj, langMaps.recipes.detail.cookTime)}
                  </dt>
                  <dd>{recipe.cookTimeMinutes} min</dd>
                </div>
              ) : null}
            </dl>
          </RecipeDetailSectionCard>

          <RecipeDetailSectionCard
            title={ts(langObj, langMaps.recipes.detail.ingredients)}
          >
            {recipe.ingredients.length === 0 ? (
              <p className="text-muted-foreground">
                {ts(langObj, langMaps.recipes.detail.ingredientsEmpty)}
              </p>
            ) : (
              <div
                className={cn(
                  "grid gap-x-4",
                  ingredientColumns.length > 1 ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                {ingredientColumns.map((column, columnIndex) => (
                  <ul key={columnIndex} className="min-w-0 space-y-2">
                    {column.map((ingredient) => {
                      const unitLabel = formatIngredientUnit(ingredient.unit);
                      const quantity = [ingredient.amount, unitLabel]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <li
                          key={ingredient.id}
                          className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5"
                        >
                          <span className="font-medium break-words">
                            {ingredient.name}
                          </span>
                          {quantity ? (
                            <span className="text-muted-foreground shrink-0">
                              {quantity}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ))}
              </div>
            )}
          </RecipeDetailSectionCard>
          </div>

          <div className="flex flex-col gap-4">
          <RecipeDetailSectionCard
            title={ts(langObj, langMaps.recipes.detail.steps)}
          >
            {recipe.steps.length === 0 ? (
              <p className="text-muted-foreground">
                {ts(langObj, langMaps.recipes.detail.stepsEmpty)}
              </p>
            ) : (
              <ol className="list-decimal space-y-4 pl-5">
                {recipe.steps.map((step) => (
                  <li key={step.id} className="whitespace-pre-wrap">
                    {step.instruction}
                  </li>
                ))}
              </ol>
            )}
          </RecipeDetailSectionCard>

          {recipe.notes ? (
            <RecipeDetailSectionCard
              title={ts(langObj, langMaps.recipes.detail.notes)}
            >
              <p className="whitespace-pre-wrap">{recipe.notes}</p>
            </RecipeDetailSectionCard>
          ) : null}
          </div>
        </div>

        {recipe.sourceUrl ? (
          <p>
            <Link
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {ts(langObj, langMaps.recipes.viewSource)}
            </Link>
          </p>
        ) : null}
      </article>
    </RecipesAppShell>
  );
}
