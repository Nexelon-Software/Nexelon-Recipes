"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ChefHat } from "lucide-react";
import Image from "next/image";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  formatMinutes,
  getDifficultyColor,
  type Recipe,
  type RecipeCategory,
  type RecipeDifficulty,
} from "~/types/recipe";
import { langMaps } from "~/language/langMaps";
import { type TranslationKey } from "~/language/useTranslation";

type ColumnsConfig = {
  t: (key: TranslationKey) => string;
};

function categoryLabelKey(category: RecipeCategory): TranslationKey {
  return (langMaps.recipes.categories as Record<RecipeCategory, TranslationKey>)[
    category
  ];
}

function difficultyLabelKey(
  difficulty: RecipeDifficulty | null,
): TranslationKey {
  if (!difficulty) return langMaps.recipes.difficulties.unknown;
  return (
    langMaps.recipes.difficulties as Record<RecipeDifficulty, TranslationKey>
  )[difficulty];
}

export function getRecipeColumns({
  t,
}: ColumnsConfig): ColumnDef<Recipe, unknown>[] {
  return [
    {
      id: "image",
      accessorKey: "imageUrl",
      enableSorting: false,
      header: () => (
        <span className="sr-only">{t(langMaps.recipes.columns.image)}</span>
      ),
      cell: ({ row }) => {
        const url = row.original.imageUrl;
        return (
          <div className="bg-muted relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
            {url ? (
              <Image
                src={url}
                alt={row.original.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <ChefHat className="text-muted-foreground/50 h-5 w-5" />
            )}
          </div>
        );
      },
      size: 60,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t(langMaps.recipes.columns.name)}
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-muted-foreground line-clamp-1 max-w-[28rem] text-xs">
            {row.original.description}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t(langMaps.recipes.columns.category)}
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {t(categoryLabelKey(row.original.category))}
        </Badge>
      ),
      filterFn: (row, _id, value: string[]) => {
        if (!value || value.length === 0) return true;
        return value.includes(row.original.category);
      },
    },
    {
      accessorKey: "cuisine",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t(langMaps.recipes.columns.cuisine)}
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm capitalize">{row.original.cuisine}</span>
      ),
      filterFn: (row, _id, value: string[]) => {
        if (!value || value.length === 0) return true;
        return value.includes(row.original.cuisine);
      },
    },
    {
      accessorKey: "totalTimeMinutes",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t(langMaps.recipes.columns.time)}
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatMinutes(row.original.totalTimeMinutes)}
        </span>
      ),
      sortingFn: (a, b) => {
        const av = a.original.totalTimeMinutes ?? Number.MAX_SAFE_INTEGER;
        const bv = b.original.totalTimeMinutes ?? Number.MAX_SAFE_INTEGER;
        return av - bv;
      },
    },
    {
      accessorKey: "difficulty",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t(langMaps.recipes.columns.difficulty)}
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = row.original.difficulty;
        return (
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className={`h-2.5 w-2.5 rounded-full ${getDifficultyColor(d)}`}
            />
            <span className="text-sm">{t(difficultyLabelKey(d))}</span>
          </span>
        );
      },
      filterFn: (row, _id, value: string[]) => {
        if (!value || value.length === 0) return true;
        const d = row.original.difficulty ?? "";
        return value.includes(d);
      },
    },
    {
      accessorKey: "servings",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t(langMaps.recipes.columns.servings)}
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.servings ?? "—"}</span>
      ),
    },
    {
      accessorKey: "tags",
      enableSorting: false,
      header: () => <span>{t(langMaps.recipes.columns.tags)}</span>,
      cell: ({ row }) => {
        const tags = row.original.tags ?? [];
        if (tags.length === 0) return null;
        const visible = tags.slice(0, 2);
        const rest = tags.length - visible.length;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {visible.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {rest > 0 ? (
              <Badge variant="outline" className="text-xs">
                +{rest}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
  ];
}

export { categoryLabelKey, difficultyLabelKey };
