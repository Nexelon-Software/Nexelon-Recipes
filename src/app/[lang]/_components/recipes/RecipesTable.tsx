"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { langMaps } from "~/language/langMaps";
import useTranslation from "~/language/useTranslation";
import type { Locale } from "~/language/i18n.config";
import {
  type Recipe,
  type RecipeCategory,
  type RecipeDifficulty,
} from "~/types/recipe";

import { getRecipeColumns } from "./recipes.columns";
import { FilterBar } from "./FilterBar";
import { RecipeListItem } from "./RecipeListItem";

const COLUMN_VISIBILITY_KEY = "dataTable:columnVisibility:recipes";

interface RecipesTableProps {
  recipes: Recipe[];
  cuisines: string[];
  lang: Locale;
}

function isVisibilityState(value: unknown): value is VisibilityState {
  if (!value || typeof value !== "object") return false;
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== "boolean") return false;
  }
  return true;
}

export function RecipesTable({ recipes, cuisines, lang }: RecipesTableProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    {},
  );

  const [categoryFilter, setCategoryFilter] = React.useState<RecipeCategory[]>(
    [],
  );
  const [difficultyFilter, setDifficultyFilter] = React.useState<
    RecipeDifficulty[]
  >([]);
  const [cuisineFilter, setCuisineFilter] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(COLUMN_VISIBILITY_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (isVisibilityState(parsed)) setColumnVisibility(parsed);
    } catch {
      // ignore invalid persisted state
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        COLUMN_VISIBILITY_KEY,
        JSON.stringify(columnVisibility),
      );
    } catch {
      // ignore storage failures (quota / private mode)
    }
  }, [columnVisibility]);

  React.useEffect(() => {
    setColumnFilters((prev) => {
      const next = prev.filter(
        (f) => !["category", "difficulty", "cuisine"].includes(f.id),
      );
      if (categoryFilter.length > 0)
        next.push({ id: "category", value: categoryFilter });
      if (difficultyFilter.length > 0)
        next.push({ id: "difficulty", value: difficultyFilter });
      if (cuisineFilter.length > 0)
        next.push({ id: "cuisine", value: cuisineFilter });
      return next;
    });
  }, [categoryFilter, difficultyFilter, cuisineFilter]);

  const columns = React.useMemo(() => getRecipeColumns({ t }), [t]);

  const table = useReactTable({
    data: recipes,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: (v: unknown) =>
      setGlobalFilter(typeof v === "string" ? v : ""),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, value) => {
      const search = String(value ?? "").trim().toLowerCase();
      if (!search) return true;
      const r = row.original;
      const haystackParts: string[] = [
        r.name,
        r.description ?? "",
        r.cuisine ?? "",
        r.category ?? "",
        r.notes ?? "",
        ...(r.tags ?? []),
        ...(r.ingredients ?? []).map((i) => i.name),
      ];
      const haystack = haystackParts.join(" \u0001 ").toLowerCase();
      return haystack.includes(search);
    },
  });

  const rows = table.getRowModel().rows;
  const filteredCount = rows.length;
  const totalCount = recipes.length;

  function clearAll() {
    setGlobalFilter("");
    setCategoryFilter([]);
    setDifficultyFilter([]);
    setCuisineFilter([]);
  }

  function recipeHref(id: string) {
    const prefix = lang === "sk" ? "" : `/${lang}`;
    return `${prefix}/recipes/${id}`;
  }

  function handleRowClick(id: string) {
    router.push(recipeHref(id));
  }

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
        cuisineFilter={cuisineFilter}
        setCuisineFilter={setCuisineFilter}
        cuisines={cuisines}
        totalCount={totalCount}
        filteredCount={filteredCount}
        onClearAll={clearAll}
      />

      <div className="md:hidden">
        {rows.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            {t(langMaps.recipes.noResults)}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li key={row.id}>
                <RecipeListItem
                  recipe={row.original}
                  href={recipeHref(row.original.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-card hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground py-12 text-center"
                >
                  {t(langMaps.recipes.noResults)}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
