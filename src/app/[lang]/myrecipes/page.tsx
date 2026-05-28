import { redirect } from "next/navigation";

import type { Locale } from "~/language/i18n.config";

import { RecipeList } from "./_components/RecipeList";
import { RecipesAppShell } from "./_components/RecipesAppShell";
import { getRecipesPageContext } from "./_lib/page-data";

export default async function RecipesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const { session, loginPath, imageUrl, userId, displayName } =
    await getRecipesPageContext(lang);

  if (!session?.user) {
    redirect(loginPath);
  }

  return (
    <RecipesAppShell lang={lang} loginPath={loginPath} imageUrl={imageUrl}>
      <RecipeList currentUserId={userId} displayName={displayName} />
    </RecipesAppShell>
  );
}
