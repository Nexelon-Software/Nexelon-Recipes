"use client";

import Image from "next/image";
import Link from "next/link";
import { ChefHat, ChevronRight, Clock } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { langMaps } from "~/language/langMaps";
import useTranslation from "~/language/useTranslation";
import {
  formatMinutes,
  getDifficultyColor,
  type Recipe,
} from "~/types/recipe";
import {
  categoryLabelKey,
  difficultyLabelKey,
} from "./recipes.columns";

interface RecipeListItemProps {
  recipe: Recipe;
  href: string;
}

export function RecipeListItem({ recipe, href }: RecipeListItemProps) {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      className="group bg-card hover:bg-accent/40 active:bg-accent/60 flex items-stretch gap-3 rounded-xl border p-3 shadow-sm transition-colors"
    >
      <div className="bg-muted relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <ChefHat className="text-muted-foreground/50 h-8 w-8" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            {recipe.name}
          </h3>
          <ChevronRight className="text-muted-foreground/60 group-hover:text-foreground mt-0.5 h-4 w-4 shrink-0 transition-colors" />
        </div>

        {recipe.description ? (
          <p className="text-muted-foreground line-clamp-1 text-xs">
            {recipe.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Badge variant="secondary" className="text-[10px]">
            {t(categoryLabelKey(recipe.category))}
          </Badge>
          {recipe.totalTimeMinutes !== null ? (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px] tabular-nums">
              <Clock className="h-3 w-3" />
              {formatMinutes(recipe.totalTimeMinutes)}
            </span>
          ) : null}
          <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${getDifficultyColor(recipe.difficulty)}`}
            />
            {t(difficultyLabelKey(recipe.difficulty))}
          </span>
          {recipe.cuisine ? (
            <span className="text-muted-foreground/80 text-[10px] capitalize">
              · {recipe.cuisine}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function RecipeListItemSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
      {t(langMaps.recipes.noResults)}
    </div>
  );
}
