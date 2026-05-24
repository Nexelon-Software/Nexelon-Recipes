"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { localePath } from "~/lib/seo-url";
import { cn } from "~/lib/utils";
import useTranslation from "~/language/useTranslation";
import { api } from "~/trpc/react";

import { RecipeListTile, RecipeListTileSkeleton } from "./RecipeListTile";

export function RecipeList({ currentUserId }: { currentUserId: string | null }) {
  const { t, lang, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState<string | undefined>();

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
    { search: querySearch },
    { placeholderData: keepPreviousData },
  );

  return (
    <div className="container mx-auto space-y-6 px-3 py-6 sm:px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t(lang.recipes.title)}</h1>
          <p className="text-muted-foreground text-sm">
            {t(lang.recipes.description)}
          </p>
        </div>
        {currentUserId ? (
          <Link
            href={localePath(locale, "/recipes/new")}
            className={cn(buttonVariants())}
          >
            {t(lang.recipes.actions.create)}
          </Link>
        ) : null}
      </div>

      <div className="max-w-md">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t(lang.recipes.searchPlaceholder)}
          aria-label={t(lang.recipes.searchLabel)}
        />
      </div>

      {isLoading && recipes.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 3 }, (_, index) => (
            <RecipeListTileSkeleton key={index} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {t(lang.recipes.noResults)}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((recipe) => (
            <RecipeListTile
              key={recipe.id}
              recipe={recipe}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
