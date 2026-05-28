import { notFound, redirect } from "next/navigation";

import { localePath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";
import { api } from "~/trpc/server";

import { RecipeForm } from "../../_components/RecipeForm";
import { RecipesAppShell } from "../../_components/RecipesAppShell";
import { getRecipesPageContext } from "../../_lib/page-data";

export default async function EditRecipePage({
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

  if (recipe.createdById !== userId) {
    redirect(localePath(lang, `/myrecipes/${recipeId}`));
  }

  return (
    <RecipesAppShell lang={lang} imageUrl={imageUrl}>
      <RecipeForm mode="edit" recipeId={recipeId} initialRecipe={recipe} />
    </RecipesAppShell>
  );
}
