import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";

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
  const { session, loginPath, imageUrl, userId } =
    await getRecipesPageContext(lang);
  const langObj = await getLanguage(lang);

  return (
    <RecipesAppShell
      lang={lang}
      imageUrl={imageUrl}
      loginPath={session?.user ? undefined : loginPath}
      userId={userId}
    >
      <RecipeList
        currentUserId={userId}
        displayName=""
        pageTitle={ts(langObj, langMaps.recipes.title)}
      />
    </RecipesAppShell>
  );
}
