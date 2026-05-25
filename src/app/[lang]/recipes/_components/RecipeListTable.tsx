"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChefHat, Pencil } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
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

import {
  recipeBreadcrumb,
  totalMinutes,
  type RecipeListItem,
} from "./RecipeListTile";

function TableRecipeThumbnail({
  recipe,
  detailHref,
}: {
  recipe: RecipeListItem;
  detailHref: string;
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [recipe.imageUrl]);

  const showImage = Boolean(recipe.imageUrl?.trim()) && !imageError;

  return (
    <Link href={detailHref} className="block size-10 overflow-hidden rounded">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.imageUrl!}
          alt=""
          className="size-10 object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="bg-muted text-muted-foreground flex size-10 items-center justify-center"
          aria-hidden
        >
          <ChefHat className="size-5 opacity-60" strokeWidth={1.25} />
        </div>
      )}
    </Link>
  );
}

export function RecipeListTable({
  recipes,
  currentUserId,
}: {
  recipes: RecipeListItem[];
  currentUserId: string | null;
}) {
  const { t, lang, locale } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <span className="sr-only">{t(lang.recipes.columns.image)}</span>
          </TableHead>
          <TableHead>{t(lang.recipes.columns.name)}</TableHead>
          <TableHead>{t(lang.recipes.columns.category)}</TableHead>
          <TableHead className="hidden md:table-cell">
            {t(lang.recipes.columns.cuisine)}
          </TableHead>
          <TableHead>{t(lang.recipes.columns.time)}</TableHead>
          <TableHead>{t(lang.recipes.columns.difficulty)}</TableHead>
          <TableHead className="hidden sm:table-cell">
            {t(lang.recipes.columns.servings)}
          </TableHead>
          <TableHead className="w-10">
            <span className="sr-only">{t(lang.recipes.actions.edit)}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recipes.map((recipe) => {
          const detailHref = localePath(locale, `/recipes/${recipe.id}`);
          const isOwner = currentUserId === recipe.createdById;
          const minutes = totalMinutes(recipe);
          const categoryLabel = recipe.category
            ? t(
                lang.recipes.categories[
                  recipe.category as keyof typeof lang.recipes.categories
                ],
              )
            : "—";
          const cuisineLabel = recipe.cuisine?.trim() ?? "—";
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
              : "—";

          return (
            <TableRow key={recipe.id}>
              <TableCell>
                <TableRecipeThumbnail recipe={recipe} detailHref={detailHref} />
              </TableCell>
              <TableCell className="max-w-[200px] whitespace-normal">
                <Link
                  href={detailHref}
                  className="hover:underline font-medium"
                >
                  {recipe.name}
                </Link>
                {breadcrumb ? (
                  <p className="text-muted-foreground line-clamp-1 text-xs">
                    {breadcrumb}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>{categoryLabel}</TableCell>
              <TableCell className="hidden md:table-cell">
                {cuisineLabel}
              </TableCell>
              <TableCell>
                {minutes != null
                  ? t(lang.recipes.list.minutes).replace(
                      "{minutes}",
                      String(minutes),
                    )
                  : "—"}
              </TableCell>
              <TableCell>{difficultyLabel}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {recipe.servings ?? "—"}
              </TableCell>
              <TableCell>
                {isOwner ? (
                  <Link
                    href={localePath(locale, `/recipes/${recipe.id}/edit`)}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-xs" }),
                    )}
                    aria-label={t(lang.recipes.actions.edit)}
                  >
                    <Pencil />
                  </Link>
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function RecipeListTableSkeleton() {
  const { t, lang } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <span className="sr-only">{t(lang.recipes.columns.image)}</span>
          </TableHead>
          <TableHead>{t(lang.recipes.columns.name)}</TableHead>
          <TableHead>{t(lang.recipes.columns.category)}</TableHead>
          <TableHead className="hidden md:table-cell">
            {t(lang.recipes.columns.cuisine)}
          </TableHead>
          <TableHead>{t(lang.recipes.columns.time)}</TableHead>
          <TableHead>{t(lang.recipes.columns.difficulty)}</TableHead>
          <TableHead className="hidden sm:table-cell">
            {t(lang.recipes.columns.servings)}
          </TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }, (_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="bg-muted size-10 animate-pulse rounded" />
            </TableCell>
            <TableCell>
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            </TableCell>
            <TableCell>
              <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            </TableCell>
            <TableCell>
              <div className="bg-muted h-4 w-12 animate-pulse rounded" />
            </TableCell>
            <TableCell>
              <div className="bg-muted h-4 w-14 animate-pulse rounded" />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <div className="bg-muted h-4 w-8 animate-pulse rounded" />
            </TableCell>
            <TableCell />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
