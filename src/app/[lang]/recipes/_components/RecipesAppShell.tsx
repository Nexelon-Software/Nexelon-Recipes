import Link from "next/link";
import { ChefHat, Users } from "lucide-react";

import { UserAvatarLink } from "~/app/_components/UserAvatarLink";
import { buttonVariants } from "~/components/ui/button";
import { localePath } from "~/lib/seo-url";
import { cn } from "~/lib/utils";
import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";

export async function RecipesAppShell({
  lang,
  imageUrl,
  loginPath,
  userId,
  children,
}: {
  lang: Locale;
  imageUrl: string | null;
  /** When set, show Sign in instead of the settings avatar (guest view). */
  loginPath?: string;
  /** Signed-in user id for the My recipes header link. */
  userId?: string | null;
  children: React.ReactNode;
}) {
  const langObj = await getLanguage(lang);
  const settingsPath = localePath(lang, "/settings");
  const myRecipesPath = userId
    ? localePath(lang, `/${userId}/recipes`)
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4">
          <div className="flex items-center gap-1">
            <Link
              href={localePath(lang, "/recipes")}
              className="text-foreground hover:text-foreground/80 inline-flex shrink-0 rounded-md p-1 transition-colors"
              aria-label={ts(langObj, langMaps.recipes.title)}
            >
              <ChefHat className="size-5" aria-hidden />
            </Link>
            <Link
              href={localePath(lang, "/people")}
              className="text-foreground hover:text-foreground/80 inline-flex shrink-0 rounded-md p-1 transition-colors"
              aria-label={ts(langObj, langMaps.nav.people)}
            >
              <Users className="size-5" aria-hidden />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {loginPath ? (
              <Link
                href={loginPath}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                )}
              >
                {ts(langObj, langMaps.auth.login.title)}
              </Link>
            ) : (
              <>
                {myRecipesPath ? (
                  <Link
                    href={myRecipesPath}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                    )}
                  >
                    {ts(langObj, langMaps.recipes.myRecipes)}
                  </Link>
                ) : null}
                <UserAvatarLink
                  imageUrl={imageUrl}
                  settingsPath={settingsPath}
                  settingsLabel={ts(langObj, langMaps.auth.settings.avatarLink)}
                />
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
