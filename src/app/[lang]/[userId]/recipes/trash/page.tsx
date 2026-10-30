import { redirect } from "next/navigation";

import type { Locale } from "~/language/i18n.config";
import { localePath } from "~/lib/seo-url";

import { TrashRecipeList } from "../../../recipes/_components/TrashRecipeList";
import { RecipesAppShell } from "../../../recipes/_components/RecipesAppShell";
import {
  getRecipesPageContext,
  getUserDisplayName,
} from "../../../recipes/_lib/page-data";

export default async function UserRecipesTrashPage({
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

  if (currentUserId !== userId) {
    redirect(localePath(lang, `/${userId}/recipes`));
  }

  const displayName = await getUserDisplayName(userId);
  if (!displayName) {
    redirect(localePath(lang, "/recipes"));
  }

  return (
    <RecipesAppShell lang={lang} imageUrl={imageUrl} userId={currentUserId}>
      <TrashRecipeList userId={userId} />
    </RecipesAppShell>
  );
}
