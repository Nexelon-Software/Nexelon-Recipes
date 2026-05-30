"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { ChefHat } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { localePath } from "~/lib/seo-url";
import {
  DEFAULT_RECIPE_LIST_LAYOUT,
  readStoredRecipeListLayout,
  type RecipeListLayoutId,
  writeStoredRecipeListLayout,
} from "~/lib/recipe-list-layout";
import { cn } from "~/lib/utils";
import { format } from "~/language/lang";
import useTranslation from "~/language/useTranslation";
import { api } from "~/trpc/react";

import { RecipeListLayoutSwitcher } from "./RecipeListLayoutSwitcher";
import {
  RecipeListItemSkeleton,
  RecipeListItemView,
} from "./RecipeListTile";
import { RecipeListTable, RecipeListTableSkeleton } from "./RecipeListTable";

function listContainerClass(layout: RecipeListLayoutId): string {
  switch (layout) {
    case "list":
      return "flex flex-col gap-3";
    case "compact":
      return "flex flex-col gap-2";
    case "grid":
    default:
      return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  }
}

export function RecipeList({
  currentUserId,
  displayName,
  profileUserId,
  pageTitle,
}: {
  currentUserId: string | null;
  displayName: string;
  profileUserId?: string;
  pageTitle?: string;
}) {
  const { t, lang, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState<string | undefined>();
  const [layout, setLayout] = useState<RecipeListLayoutId>(
    DEFAULT_RECIPE_LIST_LAYOUT,
  );
  const [layoutMounted, setLayoutMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredRecipeListLayout();
    if (stored) {
      setLayout(stored);
    }
    setLayoutMounted(true);
  }, []);

  const handleLayoutChange = useCallback((id: RecipeListLayoutId) => {
    setLayout(id);
    writeStoredRecipeListLayout(id);
  }, []);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 3) {
      setQuerySearch(undefined);
      return;
    }

    const timer = setTimeout(() => setQuerySearch(trimmed), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: recipes = [], isLoading } = api.recipe.list.useQuery(
    profileUserId
      ? { search: querySearch, userId: profileUserId }
      : { search: querySearch },
    { placeholderData: keepPreviousData },
  );

  const activeLayout = layoutMounted ? layout : DEFAULT_RECIPE_LIST_LAYOUT;
  const showVisibility = !profileUserId;

  const renderContent = () => {
    if (isLoading && recipes.length === 0) {
      if (activeLayout === "table") {
        return <RecipeListTableSkeleton />;
      }
      return (
        <div className={listContainerClass(activeLayout)}>
          {Array.from({ length: activeLayout === "compact" ? 5 : 3 }, (_, index) => (
            <RecipeListItemSkeleton key={index} layout={activeLayout} />
          ))}
        </div>
      );
    }

    if (recipes.length === 0) {
      return (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {t(lang.recipes.noResults)}
        </p>
      );
    }

    if (activeLayout === "table") {
      return (
        <RecipeListTable
          recipes={recipes}
          currentUserId={currentUserId}
          showVisibility={showVisibility}
        />
      );
    }

    return (
      <div className={listContainerClass(activeLayout)}>
        {recipes.map((recipe) => (
          <RecipeListItemView
            key={recipe.id}
            recipe={recipe}
            layout={activeLayout}
            currentUserId={currentUserId}
            showVisibility={showVisibility}
          />
        ))}
      </div>
    );
  };

  const headingTitle = profileUserId
    ? (pageTitle ??
      format(t(lang.recipes.collectionOf), { username: displayName }))
    : t(lang.recipes.myRecipes);

  return (
    <div className="container mx-auto space-y-6 px-3 py-6 sm:px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold">
            <ChefHat className="size-6 shrink-0" aria-hidden />
            {headingTitle}
          </h1>
          {!profileUserId && displayName ? (
            <p className="text-muted-foreground text-sm">
              {format(t(lang.recipes.collectionOf), { username: displayName })}
            </p>
          ) : null}
        </div>
        {!profileUserId && currentUserId ? (
          <Link
            href={localePath(locale, "/myrecipes/new")}
            className={cn(buttonVariants())}
          >
            {t(lang.recipes.actions.create)}
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(lang.recipes.searchPlaceholder)}
            aria-label={t(lang.recipes.searchLabel)}
          />
        </div>
        <RecipeListLayoutSwitcher
          layout={layout}
          onLayoutChange={handleLayoutChange}
          mounted={layoutMounted}
        />
      </div>

      {renderContent()}
    </div>
  );
}
