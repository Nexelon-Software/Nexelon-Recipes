import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChefHat,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Pencil,
  Soup,
  StickyNote,
  Users,
} from "lucide-react";

import LocaleSwitcherNavbar from "../../../_components/LocaleSwitcherNavbar";
import { ThemeToggle } from "../../../_components/theme-toggle";
import { IngredientsWithPortions } from "./_components/IngredientsWithPortions";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";
import {
  formatMinutes,
  getDifficultyColor,
  getRecipeById,
  getAllRecipes,
} from "~/types/recipe";

export function generateStaticParams() {
  return getAllRecipes().map((recipe) => ({ id: recipe.id }));
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langParam, id } = await params;
  const lang = langParam as Locale;
  const recipe = getRecipeById(id);

  if (!recipe) notFound();

  const langObj = await getLanguage(lang);

  const relatedRecipes = (recipe.relatedRecipes ?? [])
    .filter((relatedId) => relatedId !== recipe.id)
    .map((relatedId) => getRecipeById(relatedId))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const categoryLabel = ts(langObj, langMaps.recipes.categories[recipe.category]);
  const difficultyLabel = recipe.difficulty
    ? ts(langObj, langMaps.recipes.difficulties[recipe.difficulty])
    : ts(langObj, langMaps.recipes.difficulties.unknown);

  const stats: Array<{
    icon: React.ReactNode;
    label: string;
    value: string | null;
  }> = [
    {
      icon: <Users className="h-4 w-4" />,
      label: ts(langObj, langMaps.recipes.detail.servings),
      value: recipe.servings !== null ? String(recipe.servings) : null,
    },
    {
      icon: <Pencil className="h-4 w-4" />,
      label: ts(langObj, langMaps.recipes.detail.prepTime),
      value:
        recipe.prepTimeMinutes !== null
          ? formatMinutes(recipe.prepTimeMinutes)
          : null,
    },
    {
      icon: <Soup className="h-4 w-4" />,
      label: ts(langObj, langMaps.recipes.detail.cookTime),
      value:
        recipe.cookTimeMinutes !== null
          ? formatMinutes(recipe.cookTimeMinutes)
          : null,
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: ts(langObj, langMaps.recipes.detail.totalTime),
      value:
        recipe.totalTimeMinutes !== null
          ? formatMinutes(recipe.totalTimeMinutes)
          : null,
    },
    {
      icon: <Flame className="h-4 w-4" />,
      label: ts(langObj, langMaps.recipes.detail.ovenTemperature),
      value:
        recipe.ovenTemperatureCelsius !== null
          ? `${recipe.ovenTemperatureCelsius} °C`
          : null,
    },
  ];
  const visibleStats = stats.filter((s) => s.value !== null);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4">
          <Link
            href={lang === "sk" ? "/" : `/${lang}`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">
              {ts(langObj, langMaps.recipes.backToList)}
            </span>
          </Link>
          <h1 className="line-clamp-1 text-base font-semibold sm:text-lg">
            {recipe.name}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitcherNavbar />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex w-full flex-1 flex-col gap-6 px-3 py-4 sm:px-4 sm:py-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-2xl border lg:max-w-md">
            {recipe.imageUrl ? (
              <Image
                src={recipe.imageUrl}
                alt={recipe.name}
                fill
                sizes="(max-width: 1024px) 100vw, 28rem"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <ChefHat className="text-muted-foreground/50 h-12 w-12" />
                <span className="text-muted-foreground/70 text-xs">
                  {ts(langObj, langMaps.recipes.detail.noImage)}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{categoryLabel}</Badge>
              <span className="bg-muted inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${getDifficultyColor(recipe.difficulty)}`}
                />
                {difficultyLabel}
              </span>
              {recipe.cuisine ? (
                <Badge variant="outline" className="capitalize">
                  {recipe.cuisine}
                </Badge>
              ) : null}
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {recipe.name}
            </h2>

            {recipe.description ? (
              <p className="text-muted-foreground text-base leading-relaxed">
                {recipe.description}
              </p>
            ) : null}

            <div className="text-muted-foreground text-xs">
              {ts(langObj, langMaps.recipes.detail.owner)}: {recipe.owner}
            </div>

            {visibleStats.length > 0 ? (
              <div className="bg-card mt-2 grid grid-cols-2 gap-3 rounded-2xl border p-4 sm:grid-cols-3 md:grid-cols-5">
                {visibleStats.map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-start gap-1"
                  >
                    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                      {s.icon}
                      {s.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {recipe.tags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <section className="bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:p-5">
            <h3 className="text-lg font-semibold">
              {ts(langObj, langMaps.recipes.detail.ingredients)}
            </h3>
            {recipe.ingredients.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {ts(langObj, langMaps.recipes.detail.ingredientsEmpty)}
              </p>
            ) : (
              <>
                {recipe.servings !== null ? (
                  <IngredientsWithPortions
                    baseServings={recipe.servings}
                    ingredients={recipe.ingredients}
                    labels={{
                      portions: ts(langObj, langMaps.recipes.detail.portions),
                      reset: ts(langObj, langMaps.recipes.detail.reset),
                    }}
                  />
                ) : (
                  <ul className="divide-y">
                    {recipe.ingredients.map((ing, idx) => {
                      const qty =
                        ing.quantity !== null ? String(ing.quantity) : "";
                      const unit = ing.unit ?? "";
                      const amount = [qty, unit].filter(Boolean).join(" ");
                      return (
                        <li
                          key={`${ing.name}-${idx}`}
                          className="flex items-start justify-between gap-3 py-2.5"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {ing.name}
                            </span>
                            {ing.notes ? (
                              <span className="text-muted-foreground text-xs">
                                {ing.notes}
                              </span>
                            ) : null}
                          </div>
                          {amount ? (
                            <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                              {amount}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}

            {recipe.equipment.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2 border-t pt-3">
                <h4 className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                  <Layers className="h-3.5 w-3.5" />
                  {ts(langObj, langMaps.recipes.detail.equipment)}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.equipment.map((eq) => (
                    <Badge key={eq} variant="outline" className="text-xs">
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:p-5">
            <h3 className="text-lg font-semibold">
              {ts(langObj, langMaps.recipes.detail.steps)}
            </h3>
            {recipe.steps.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {ts(langObj, langMaps.recipes.detail.stepsEmpty)}
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {recipe.steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="bg-background flex gap-3 rounded-xl border p-3 sm:p-4"
                  >
                    <span className="bg-primary text-primary-foreground inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums">
                      {idx + 1}
                    </span>
                    <p className="text-sm leading-relaxed sm:text-base">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {relatedRecipes.length > 0 ? (
          <section className="bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:p-5">
            <h3 className="text-lg font-semibold">
              {ts(langObj, langMaps.recipes.detail.relatedRecipesTitle)}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedRecipes.map((r) => (
                <Link
                  key={r.id}
                  href={
                    lang === "sk"
                      ? `/recipes/${r.id}`
                      : `/${lang}/recipes/${r.id}`
                  }
                  className="hover:bg-accent/40 focus-visible:ring-ring group flex flex-col gap-1.5 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="line-clamp-2 text-sm font-semibold">
                        {r.name}
                      </span>
                      {r.description ? (
                        <span className="text-muted-foreground line-clamp-2 text-xs">
                          {r.description}
                        </span>
                      ) : null}
                    </div>
                    <ArrowLeft className="text-muted-foreground/70 h-4 w-4 rotate-180 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Badge variant="secondary" className="text-[11px]">
                      {ts(langObj, langMaps.recipes.categories[r.category])}
                    </Badge>
                    {r.difficulty ? (
                      <span className="bg-muted inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]">
                        <span
                          aria-hidden
                          className={`h-2 w-2 rounded-full ${getDifficultyColor(r.difficulty)}`}
                        />
                        {ts(langObj, langMaps.recipes.difficulties[r.difficulty])}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {(Boolean(recipe.notes) ||
          Boolean(recipe.sourceUrl) ||
          recipe.references.length > 0) && (
          <section className="grid gap-4 md:grid-cols-2">
            {recipe.notes ? (
              <div className="bg-card flex flex-col gap-2 rounded-2xl border p-4 sm:p-5">
                <h3 className="inline-flex items-center gap-1.5 text-base font-semibold">
                  <StickyNote className="h-4 w-4" />
                  {ts(langObj, langMaps.recipes.detail.notes)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {recipe.notes}
                </p>
              </div>
            ) : null}

            {Boolean(recipe.sourceUrl) || recipe.references.length > 0 ? (
              <div className="bg-card flex flex-col gap-2 rounded-2xl border p-4 sm:p-5">
                <h3 className="text-base font-semibold">
                  {ts(langObj, langMaps.recipes.detail.source)}
                </h3>
                <div className="flex flex-col gap-1.5">
                  {recipe.sourceUrl ? (
                    <Button
                      asChild
                      variant="link"
                      className="text-primary h-auto justify-start p-0"
                    >
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        <span className="break-all">{recipe.sourceUrl}</span>
                      </a>
                    </Button>
                  ) : null}
                  {recipe.references.map((ref) => (
                    <Button
                      key={ref}
                      asChild
                      variant="link"
                      className="text-primary h-auto justify-start p-0"
                    >
                      <a
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        <span className="break-all">{ref}</span>
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}
