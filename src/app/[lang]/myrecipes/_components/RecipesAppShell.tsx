import Link from "next/link";
import { ChefHat } from "lucide-react";

import { UserAvatarLink } from "~/app/_components/UserAvatarLink";
import { localePath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";

export async function RecipesAppShell({
  lang,
  imageUrl,
  children,
}: {
  lang: Locale;
  imageUrl: string | null;
  children: React.ReactNode;
}) {
  const langObj = await getLanguage(lang);
  const settingsPath = localePath(lang, "/settings");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4">
          <Link
            href={localePath(lang, "/myrecipes")}
            className="text-foreground hover:text-foreground/80 inline-flex shrink-0 rounded-md p-1 transition-colors"
            aria-label={ts(langObj, langMaps.recipes.myRecipes)}
          >
            <ChefHat className="size-5" aria-hidden />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <UserAvatarLink
              imageUrl={imageUrl}
              settingsPath={settingsPath}
              settingsLabel={ts(langObj, langMaps.auth.settings.avatarLink)}
            />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
