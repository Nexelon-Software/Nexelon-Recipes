"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { localePath } from "~/lib/seo-url";
import { cn } from "~/lib/utils";
import useTranslation from "~/language/useTranslation";
import { api, type RouterOutputs } from "~/trpc/react";

type RecipeListItem = RouterOutputs["recipe"]["list"][number];

export function RecipeList({ currentUserId }: { currentUserId: string | null }) {
  const { t, lang, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState<string | undefined>();

  const { data: recipes = [], isLoading } = api.recipe.list.useQuery({
    search: querySearch,
  });

  const columns = useMemo<ColumnDef<RecipeListItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: t(lang.recipes.columns.name),
        cell: ({ row }) => (
          <Link
            href={localePath(locale, `/recipes/${row.original.id}`)}
            className="text-primary font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "category",
        header: t(lang.recipes.columns.category),
        cell: ({ row }) =>
          row.original.category
            ? t(
                lang.recipes.categories[
                  row.original.category as keyof typeof lang.recipes.categories
                ],
              )
            : "—",
      },
      {
        accessorKey: "servings",
        header: t(lang.recipes.columns.servings),
        cell: ({ row }) => row.original.servings ?? "—",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isOwner = currentUserId === row.original.createdById;
          return (
            <div className="flex justify-end gap-2">
              <Link
                href={localePath(locale, `/recipes/${row.original.id}`)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {t(lang.recipes.openRecipe)}
              </Link>
              {isOwner ? (
                <Link
                  href={localePath(locale, `/recipes/${row.original.id}/edit`)}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                  )}
                >
                  {t(lang.recipes.actions.edit)}
                </Link>
              ) : null}
            </div>
          );
        },
      },
    ],
    [currentUserId, lang, locale, t],
  );

  const table = useReactTable({
    data: recipes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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

      <form
        className="flex max-w-md gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuerySearch(search.trim() || undefined);
        }}
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t(lang.recipes.searchPlaceholder)}
          aria-label={t(lang.recipes.searchLabel)}
        />
        <Button type="submit" variant="secondary">
          {t(lang.recipes.searchLabel)}
        </Button>
      </form>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  …
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground text-center"
                >
                  {t(lang.recipes.noResults)}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
