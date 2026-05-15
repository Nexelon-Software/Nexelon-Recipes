"use client";

import { type Table } from "@tanstack/react-table";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { langMaps } from "~/language/langMaps";
import useTranslation, {
  type TranslationKey,
} from "~/language/useTranslation";
import {
  RECIPE_CATEGORIES,
  RECIPE_DIFFICULTIES,
  type Recipe,
  type RecipeCategory,
  type RecipeDifficulty,
} from "~/types/recipe";
import {
  categoryLabelKey,
  difficultyLabelKey,
} from "./recipes.columns";

interface FilterBarProps {
  table: Table<Recipe>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  categoryFilter: RecipeCategory[];
  setCategoryFilter: (value: RecipeCategory[]) => void;
  difficultyFilter: RecipeDifficulty[];
  setDifficultyFilter: (value: RecipeDifficulty[]) => void;
  cuisineFilter: string[];
  setCuisineFilter: (value: string[]) => void;
  cuisines: string[];
  totalCount: number;
  filteredCount: number;
  onClearAll: () => void;
}

export function FilterBar(props: FilterBarProps) {
  const {
    table,
    globalFilter,
    setGlobalFilter,
    categoryFilter,
    setCategoryFilter,
    difficultyFilter,
    setDifficultyFilter,
    cuisineFilter,
    setCuisineFilter,
    cuisines,
    totalCount,
    filteredCount,
    onClearAll,
  } = props;
  const { t } = useTranslation();

  const anyFilter =
    globalFilter.length > 0 ||
    categoryFilter.length > 0 ||
    difficultyFilter.length > 0 ||
    cuisineFilter.length > 0;

  function toggleCategory(value: RecipeCategory) {
    if (categoryFilter.includes(value)) {
      setCategoryFilter(categoryFilter.filter((v) => v !== value));
    } else {
      setCategoryFilter([...categoryFilter, value]);
    }
  }

  function toggleDifficulty(value: RecipeDifficulty) {
    if (difficultyFilter.includes(value)) {
      setDifficultyFilter(difficultyFilter.filter((v) => v !== value));
    } else {
      setDifficultyFilter([...difficultyFilter, value]);
    }
  }

  function toggleCuisine(value: string) {
    if (cuisineFilter.includes(value)) {
      setCuisineFilter(cuisineFilter.filter((v) => v !== value));
    } else {
      setCuisineFilter([...cuisineFilter, value]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Label htmlFor="recipes-search" className="sr-only">
            {t(langMaps.recipes.searchLabel)}
          </Label>
          <Input
            id="recipes-search"
            placeholder={t(langMaps.recipes.searchPlaceholder)}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-10 pl-9"
            inputMode="search"
            autoComplete="off"
          />
          {globalFilter.length > 0 ? (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="hidden h-10 w-10 md:inline-flex"
              aria-label={t(langMaps.recipes.toggleColumns)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {t(langMaps.recipes.toggleColumns)}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(Boolean(value))
                  }
                  className="capitalize"
                >
                  {columnLabel(column.id, t)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2">
        <FilterChipRow
          label={t(langMaps.recipes.filters.category)}
          options={RECIPE_CATEGORIES.map((c) => ({
            value: c,
            label: t(categoryLabelKey(c)),
          }))}
          selected={categoryFilter}
          onToggle={(v) => toggleCategory(v as RecipeCategory)}
        />
        <FilterChipRow
          label={t(langMaps.recipes.filters.difficulty)}
          options={RECIPE_DIFFICULTIES.map((d) => ({
            value: d,
            label: t(difficultyLabelKey(d)),
          }))}
          selected={difficultyFilter}
          onToggle={(v) => toggleDifficulty(v as RecipeDifficulty)}
        />

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <span className="capitalize">
                  {cuisineFilter.length === 0
                    ? `${t(langMaps.recipes.filters.cuisine)}: ${t(langMaps.recipes.filters.all)}`
                    : `${t(langMaps.recipes.filters.cuisine)}: ${cuisineFilter.length}`}
                </span>
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="capitalize">
                {t(langMaps.recipes.filters.cuisine)}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {cuisines.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={cuisineFilter.includes(c)}
                  onCheckedChange={() => toggleCuisine(c)}
                  className="capitalize"
                >
                  {c}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {anyFilter ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 px-2"
              onClick={onClearAll}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              {t(langMaps.recipes.filters.clearAll)}
            </Button>
          ) : null}

          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {filteredCount === totalCount
              ? t(langMaps.recipes.count).replace(
                  "{count}",
                  String(totalCount),
                )
              : `${filteredCount} / ${totalCount}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function FilterChipRow({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="text-muted-foreground shrink-0 text-xs font-medium">
        {label}:
      </span>
      <div className="flex shrink-0 flex-nowrap gap-1.5">
        {options.map((opt) => {
          const isActive = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={
                "inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors " +
                (isActive
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background hover:bg-accent border-input")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function columnLabel(
  columnId: string,
  t: (k: TranslationKey) => string,
): string {
  const map = langMaps.recipes.columns as Record<string, TranslationKey>;
  const key = map[columnId];
  return key ? t(key) : columnId;
}
