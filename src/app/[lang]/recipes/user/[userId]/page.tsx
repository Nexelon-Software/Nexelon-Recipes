import { redirect } from "next/navigation";

import { localePath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";

/** Legacy `/recipes/user/[userId]` → `/{userId}/recipes`. */
export default async function LegacyUserRecipesRedirect({
  params,
}: {
  params: Promise<{ lang: string; userId: string }>;
}) {
  const { lang: langParam, userId } = await params;
  const lang = langParam as Locale;
  redirect(localePath(lang, `/${userId}/recipes`));
}
