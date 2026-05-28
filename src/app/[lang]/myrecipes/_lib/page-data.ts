import { eq } from "drizzle-orm";

import { localePath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema";

export async function getRecipesPageContext(lang: Locale) {
  const session = await getSession();
  const loginPath = localePath(lang, "/login");

  let imageUrl: string | null = null;
  if (session?.user) {
    const [dbUser] = await db
      .select({ image: userTable.image })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);
    imageUrl = dbUser?.image?.trim() ?? null;
  }

  const displayName =
    session?.user?.name?.trim() ?? session?.user?.email ?? "";

  return {
    session,
    loginPath,
    imageUrl,
    userId: session?.user?.id ?? null,
    displayName,
  };
}
