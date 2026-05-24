"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChefHat,
  Clock,
  Gauge,
  Pencil,
  Users,
} from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { localePath } from "~/lib/seo-url";
import { cn } from "~/lib/utils";
import useTranslation from "~/language/useTranslation";
import type { RouterOutputs } from "~/trpc/react";

export type RecipeListItem = RouterOutputs["recipe"]["list"][number];

function totalMinutes(recipe: RecipeListItem): number | null {
  const prep = recipe.prepTimeMinutes ?? 0;
  const cook = recipe.cookTimeMinutes ?? 0;
  const total = prep + cook;
  return total > 0 ? total : null;
}

function recipeBreadcrumb(
  recipe: RecipeListItem,
  translateCategory: (category: string) => string,
): string | null {
  const parts: string[] = [];
  if (recipe.category) {
    parts.push(translateCategory(recipe.category));
  }
  if (recipe.cuisine?.trim()) {
    parts.push(recipe.cuisine.trim());
  }
  return parts.length > 0 ? parts.join(" › ") : null;
}

export function RecipeListTile({
  recipe,
  currentUserId,
}: {
  recipe: RecipeListItem;
  currentUserId: string | null;
}) {
  const { t, lang, locale } = useTranslation();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [recipe.imageUrl]);

  const detailHref = localePath(locale, `/recipes/${recipe.id}`);
  const isOwner = currentUserId === recipe.createdById;
  const showImage = Boolean(recipe.imageUrl?.trim()) && !imageError;
  const minutes = totalMinutes(recipe);
  const breadcrumb = recipeBreadcrumb(recipe, (category) =>
    t(
      lang.recipes.categories[
        category as keyof typeof lang.recipes.categories
      ],
    ),
  );

  const difficultyKey = recipe.difficulty as
    | keyof typeof lang.recipes.difficulties
    | undefined;
  const difficultyLabel =
    difficultyKey &&
    difficultyKey in lang.recipes.difficulties &&
    difficultyKey !== "unknown"
      ? t(lang.recipes.difficulties[difficultyKey])
      : null;

  return (
    <Card className="h-full gap-0 py-0">
      <div className="relative aspect-square w-full">
        <Link href={detailHref} className="block h-full w-full">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.imageUrl!}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center"
              aria-hidden
            >
              <ChefHat className="size-12 opacity-60" strokeWidth={1.25} />
            </div>
          )}
        </Link>
        {isOwner ? (
          <Link
            href={localePath(locale, `/recipes/${recipe.id}/edit`)}
            className={cn(
              buttonVariants({ variant: "secondary", size: "icon-xs" }),
              "absolute top-2 right-2 shadow-sm",
            )}
            aria-label={t(lang.recipes.actions.edit)}
          >
            <Pencil />
          </Link>
        ) : null}
      </div>

      <CardContent className="space-y-1 pt-3 pb-1">
        <Link href={detailHref} className="hover:underline">
          <h2 className="line-clamp-2 text-base leading-snug font-semibold">
            {recipe.name}
          </h2>
        </Link>
        {breadcrumb ? (
          <p className="text-muted-foreground line-clamp-1 text-xs">
            {breadcrumb}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="text-muted-foreground gap-3 border-t-0 bg-transparent py-3 text-xs">
        {recipe.servings != null ? (
          <span className="flex items-center gap-1">
            <Users className="size-3.5 shrink-0" aria-hidden />
            {recipe.servings}
          </span>
        ) : null}
        {minutes != null ? (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {t(lang.recipes.list.minutes).replace("{minutes}", String(minutes))}
          </span>
        ) : null}
        {difficultyLabel ? (
          <span className="flex items-center gap-1">
            <Gauge className="size-3.5 shrink-0" aria-hidden />
            {difficultyLabel}
          </span>
        ) : null}
      </CardFooter>
    </Card>
  );
}

export function RecipeListTileSkeleton() {
  return (
    <Card className="h-full gap-0 py-0">
      <div className="bg-muted aspect-square w-full animate-pulse" />
      <CardContent className="space-y-2 pt-3">
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
      </CardContent>
      <CardFooter className="border-t-0 bg-transparent py-3">
        <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
      </CardFooter>
    </Card>
  );
}
