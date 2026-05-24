import { redirect } from "next/navigation";

import type { Locale } from "~/language/i18n.config";

import { RecipeForm } from "../_components/RecipeForm";
import { RecipesAppShell } from "../_components/RecipesAppShell";
import { getRecipesPageContext } from "../_lib/page-data";

export default async function NewRecipePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const { session, loginPath, imageUrl } = await getRecipesPageContext(lang);

  if (!session?.user) {
    redirect(loginPath);
  }

  return (
    <RecipesAppShell lang={lang} loginPath={loginPath} imageUrl={imageUrl}>
      <RecipeForm mode="create" />
    </RecipesAppShell>
  );
}
