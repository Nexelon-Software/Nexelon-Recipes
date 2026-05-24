import Link from "next/link";

import LocaleSwitcherNavbar from "~/app/_components/LocaleSwitcherNavbar";
import { ThemeToggle } from "~/app/_components/theme-toggle";
import { UserProfileMenu } from "~/app/_components/UserProfileMenu";
import { localePath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";

export async function RecipesAppShell({
  lang,
  loginPath,
  imageUrl,
  children,
}: {
  lang: Locale;
  loginPath: string;
  imageUrl: string | null;
  children: React.ReactNode;
}) {
  const langObj = await getLanguage(lang);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4">
          <Link
            href={localePath(lang, "/recipes")}
            className="text-base font-semibold hover:underline sm:text-lg"
          >
            {ts(langObj, langMaps.recipes.title)}
          </Link>
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
      <main className="flex-1">{children}</main>
    </div>
  );
}
