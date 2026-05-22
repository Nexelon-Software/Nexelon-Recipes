import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import LocaleSwitcherNavbar from "../_components/LocaleSwitcherNavbar";
import { ThemeToggle } from "../_components/theme-toggle";
import { UserProfileMenu } from "../_components/UserProfileMenu";
import { localePath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const session = await getSession();

  if (!session?.user) {
    redirect(localePath(lang, "/login"));
  }

  const langObj = await getLanguage(lang);
  const loginPath = localePath(lang, "/login");

  const [dbUser] = await db
    .select({ image: userTable.image })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  const imageUrl = dbUser?.image?.trim() ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4">
          <h1 className="text-base font-semibold sm:text-lg">
            {ts(langObj, langMaps.recipes.title)}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitcherNavbar />
            <ThemeToggle />
            <UserProfileMenu
              imageUrl={imageUrl}
              loginPath={loginPath}
              profileLabel={ts(langObj, langMaps.auth.menu.profile)}
              signOutLabel={ts(langObj, langMaps.auth.menu.signOut)}
            />
          </div>
        </div>
      </header>

      <main className="flex-1" />
    </div>
  );
}
