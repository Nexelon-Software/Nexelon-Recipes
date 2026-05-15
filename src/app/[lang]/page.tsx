import LocaleSwitcherNavbar from "../_components/LocaleSwitcherNavbar";
import { ThemeToggle } from "../_components/theme-toggle";
import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";
import { getAllRecipes, getUniqueCuisines } from "~/types/recipe";

import { RecipesTable } from "./_components/recipes/RecipesTable";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const langObj = await getLanguage(lang);

  const recipes = getAllRecipes();
  const cuisines = getUniqueCuisines();

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
          </div>
        </div>
      </header>

      <main className="container mx-auto flex w-full flex-1 flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
        <div className="hidden flex-col gap-1 sm:flex">
          <p className="text-muted-foreground text-sm">
            {ts(langObj, langMaps.recipes.description)}
          </p>
        </div>

        <RecipesTable recipes={recipes} cuisines={cuisines} lang={lang} />
      </main>
    </div>
  );
}
