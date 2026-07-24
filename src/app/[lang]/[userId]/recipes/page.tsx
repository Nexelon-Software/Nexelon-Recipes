import { notFound } from "next/navigation";

import type { Locale } from "~/language/i18n.config";
import { format } from "~/language/lang";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";

import { RecipeList } from "../../recipes/_components/RecipeList";
import { RecipesAppShell } from "../../recipes/_components/RecipesAppShell";
import {
  getRecipesPageContext,
  getUserDisplayName,
} from "../../recipes/_lib/page-data";

export default async function UserRecipesPage({
  params,
}: {
  params: Promise<{ lang: string; userId: string }>;
}) {
  const { lang: langParam, userId } = await params;
  const lang = langParam as Locale;
  const { session, loginPath, imageUrl, userId: currentUserId } =
    await getRecipesPageContext(lang);

  const displayName = await getUserDisplayName(userId);
  if (!displayName) {
    notFound();
  }

  const langObj = await getLanguage(lang);
  const isOwnCollection = currentUserId === userId;
  const pageTitle = isOwnCollection
    ? ts(langObj, langMaps.recipes.myRecipes)
    : format(ts(langObj, langMaps.recipes.collectionOf), {
        username: displayName,
      });

  return (
    <RecipesAppShell
      lang={lang}
      imageUrl={imageUrl}
      loginPath={session?.user ? undefined : loginPath}
      userId={currentUserId}
    >
      <RecipeList
        currentUserId={currentUserId}
        displayName={displayName}
        profileUserId={userId}
        pageTitle={pageTitle}
        showCreate={isOwnCollection}
      />
    </RecipesAppShell>
  );
}
