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
import { CopyRecipeLinkButton } from "../_components/CopyRecipeLinkButton";
import { ExportRecipeButton } from "../_components/ExportRecipeButton";
import { RecipeAuthorLink } from "../_components/RecipeAuthorLink";
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

  const recipePath = localePath(lang, `/recipes/${recipeId}`);
  const loginWithCallback = `${loginPath}?callback=${encodeURIComponent(recipePath)}`;

  let recipe;
  try {
    recipe = await api.recipe.getById({ id: recipeId });
  } catch {
    if (!session?.user) {
      redirect(loginWithCallback);
    }
    notFound();
  }

  const langObj = await getLanguage(lang);
  const isOwner = userId === recipe.createdById;
  const isPublic = recipe.visibility === "public";
  const listHref =
    isOwner || userId
      ? localePath(lang, `/${recipe.createdById}/recipes`)
      : localePath(lang, "/recipes");

  const author = recipe.createdBy;
  const authorDisplayName = author
    ? author.name?.trim() ||
      author.email?.trim() ||
      ts(langObj, langMaps.people.unknownName)
    : null;

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

  return (
    <RecipesAppShell
      lang={lang}
      imageUrl={imageUrl}
      loginPath={session?.user ? undefined : loginWithCallback}
      userId={userId}
    >
      <article className="container mx-auto max-w-5xl space-y-8 px-3 py-6 sm:px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              href={listHref}
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
            {author && authorDisplayName ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-muted-foreground text-sm">
                  {ts(langObj, langMaps.recipes.detail.owner)}:
                </span>
                <RecipeAuthorLink
                  href={localePath(lang, `/${author.id}/recipes`)}
                  name={authorDisplayName}
                  image={author.image}
                  ariaLabel={`${ts(langObj, langMaps.people.viewRecipes)}: ${authorDisplayName}`}
                />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {isPublic ? (
              <CopyRecipeLinkButton
                copyLabel={ts(langObj, langMaps.recipes.actions.copyLink)}
                copiedLabel={ts(langObj, langMaps.recipes.actions.linkCopied)}
              />
            ) : null}
            {isOwner ? (
              <>
                <ExportRecipeButton recipe={recipeDetailToRecipeInput(recipe)} />
                <Link
                  href={localePath(lang, `/recipes/${recipe.id}/edit`)}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                  )}
                >
                  {ts(langObj, langMaps.recipes.actions.edit)}
                </Link>
                <DeleteRecipeButton
                  recipeId={recipe.id}
                  redirectPath={localePath(
                    lang,
                    `/${recipe.createdById}/recipes`,
                  )}
                />
              </>
            ) : null}
          </div>
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
              <div>
                <dt className="text-muted-foreground text-sm">
                  {ts(langObj, langMaps.recipes.detail.visibility)}
                </dt>
                <dd>
                  {ts(
                    langObj,
                    recipe.visibility === "public"
                      ? langMaps.recipes.visibility.public
                      : langMaps.recipes.visibility.private,
                  )}
                </dd>
              </div>
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
              <ul className="divide-border divide-y">
                {recipe.ingredients.map((ingredient) => {
                  const unitLabel = formatIngredientUnit(ingredient.unit);
                  const quantity = [ingredient.amount, unitLabel]
                    .filter(Boolean)
                    .join("\u00a0");

                  return (
                    <li
                      key={ingredient.id}
                      className="grid grid-cols-1 gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-4"
                    >
                      <span className="min-w-0 text-base leading-snug font-medium wrap-break-word">
                        {ingredient.name}
                      </span>
                      {quantity ? (
                        <span className="text-muted-foreground text-sm tabular-nums sm:text-right sm:text-base">
                          {quantity}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
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
