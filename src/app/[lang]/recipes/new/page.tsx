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
  const { session, loginPath, imageUrl, userId } =
    await getRecipesPageContext(lang);

  if (!session?.user || !userId) {
    redirect(loginPath);
  }

  return (
    <RecipesAppShell lang={lang} imageUrl={imageUrl} userId={userId}>
      <RecipeForm mode="create" ownerUserId={userId} />
    </RecipesAppShell>
  );
}
