import Link from "next/link";

import { buttonVariants } from "~/components/ui/button";
import { localePath } from "~/lib/seo-url";
import { cn } from "~/lib/utils";
import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";

import { RecipesAppShell } from "./recipes/_components/RecipesAppShell";
import { getRecipesPageContext } from "./recipes/_lib/page-data";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const { session, loginPath, imageUrl, userId } =
    await getRecipesPageContext(lang);
  const langObj = await getLanguage(lang);
  const recipesPath = localePath(lang, "/recipes");
  const myRecipesPath = userId
    ? localePath(lang, `/${userId}/recipes`)
    : null;

  return (
    <RecipesAppShell
      lang={lang}
      imageUrl={imageUrl}
      loginPath={session?.user ? undefined : loginPath}
      userId={userId}
    >
      <section className="relative flex flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"
        />
        <div className="relative container mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
          <p className="text-primary text-sm font-medium tracking-wide uppercase">
            {ts(langObj, langMaps.metadata.siteName)}
          </p>
          <div className="space-y-4">
            <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
              {ts(langObj, langMaps.home.headline)}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-xl text-base sm:text-lg">
              {ts(langObj, langMaps.home.subtitle)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={recipesPath} className={cn(buttonVariants({ size: "lg" }))}>
              {ts(langObj, langMaps.home.browseRecipes)}
            </Link>
            {session?.user && myRecipesPath ? (
              <Link
                href={myRecipesPath}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                )}
              >
                {ts(langObj, langMaps.recipes.myRecipes)}
              </Link>
            ) : (
              <Link
                href={loginPath}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                )}
              >
                {ts(langObj, langMaps.auth.login.title)}
              </Link>
            )}
          </div>
        </div>
      </section>
    </RecipesAppShell>
  );
}
