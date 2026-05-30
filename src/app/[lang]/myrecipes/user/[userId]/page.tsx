import { notFound, redirect } from "next/navigation";

import { localePath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";
import { format } from "~/language/lang";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";

import { RecipeList } from "../../_components/RecipeList";
import { RecipesAppShell } from "../../_components/RecipesAppShell";
import { getRecipesPageContext, getUserDisplayName } from "../../_lib/page-data";

export default async function UserRecipesPage({
  params,
}: {
  params: Promise<{ lang: string; userId: string }>;
}) {
  const { lang: langParam, userId } = await params;
  const lang = langParam as Locale;
  const { session, loginPath, imageUrl, userId: currentUserId } =
    await getRecipesPageContext(lang);

  if (!session?.user) {
    redirect(loginPath);
  }

  if (userId === currentUserId) {
    redirect(localePath(lang, "/myrecipes"));
  }

  const displayName = await getUserDisplayName(userId);
  if (!displayName) {
    notFound();
  }

  const langObj = await getLanguage(lang);
  const pageTitle = format(
    ts(langObj, langMaps.recipes.collectionOf),
    { username: displayName },
  );

  return (
    <RecipesAppShell lang={lang} imageUrl={imageUrl}>
      <RecipeList
        currentUserId={currentUserId}
        displayName={displayName}
        profileUserId={userId}
        pageTitle={pageTitle}
      />
    </RecipesAppShell>
  );
}
