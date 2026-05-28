"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChefHat,
  Clock,
  Gauge,
  Globe,
  Lock,
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
import type { RecipeListLayoutId } from "~/lib/recipe-list-layout";
import { cn } from "~/lib/utils";
import useTranslation from "~/language/useTranslation";
import type { RouterOutputs } from "~/trpc/react";

export type RecipeListItem = RouterOutputs["recipe"]["list"][number];

const difficultyColorClass = {
  easy: "text-success",
  medium: "text-ember",
  hard: "text-primary",
} as const;

export function totalMinutes(recipe: RecipeListItem): number | null {
  const prep = recipe.prepTimeMinutes ?? 0;
  const cook = recipe.cookTimeMinutes ?? 0;
  const total = prep + cook;
  return total > 0 ? total : null;
}

export function RecipeVisibilityMarker({
  visibility,
  label,
  compact = false,
  className,
}: {
  visibility: string;
  label: string;
  compact?: boolean;
  className?: string;
}) {
  const isPublic = visibility === "public";
  const Icon = isPublic ? Globe : Lock;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium",
        isPublic
          ? "border-ember/35 bg-ember/10 text-ember"
          : "border-border bg-muted/60 text-muted-foreground",
        className,
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {!compact ? <span>{label}</span> : null}
    </span>
  );
}

export function recipeBreadcrumb(
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

function useRecipeListItemData(
  recipe: RecipeListItem,
  currentUserId: string | null,
) {
  const { t, lang, locale } = useTranslation();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [recipe.imageUrl]);

  const detailHref = localePath(locale, `/myrecipes/${recipe.id}`);
  const editHref = localePath(locale, `/myrecipes/${recipe.id}/edit`);
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

  return {
    t,
    lang,
    locale,
    detailHref,
    editHref,
    isOwner,
    showImage,
    imageUrl: recipe.imageUrl,
    minutes,
    breadcrumb,
    difficultyKey,
    difficultyLabel,
    visibilityLabel:
      recipe.visibility === "public"
        ? t(lang.recipes.visibility.public)
        : t(lang.recipes.visibility.private),
    setImageError,
  };
}

function RecipeImageBlock({
  detailHref,
  editHref,
  isOwner,
  showImage,
  imageUrl,
  setImageError,
  editLabel,
  className,
  placeholderIconClassName,
  showEditOnImage = true,
  visibilityMarker,
}: {
  detailHref: string;
  editHref: string;
  isOwner: boolean;
  showImage: boolean;
  imageUrl: string | null;
  setImageError: (error: boolean) => void;
  editLabel: string;
  className?: string;
  placeholderIconClassName?: string;
  showEditOnImage?: boolean;
  visibilityMarker?: ReactNode;
}) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <Link href={detailHref} className="block h-full w-full">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl!}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center"
            aria-hidden
          >
            <ChefHat
              className={cn("opacity-60", placeholderIconClassName ?? "size-12")}
              strokeWidth={1.25}
            />
          </div>
        )}
      </Link>
      {visibilityMarker ? (
        <div className="absolute bottom-2 left-2 z-10 shadow-sm">
          {visibilityMarker}
        </div>
      ) : null}
      {isOwner && showEditOnImage ? (
        <Link
          href={editHref}
          className={cn(
            buttonVariants({ variant: "secondary", size: "icon-xs" }),
            "absolute top-2 right-2 shadow-sm",
          )}
          aria-label={editLabel}
        >
          <Pencil />
        </Link>
      ) : null}
    </div>
  );
}

function RecipeMetaRow({
  recipe,
  minutes,
  difficultyKey,
  difficultyLabel,
  minutesLabel,
  visibilityLabel,
  visibilityCompact = false,
  showVisibility = true,
  className,
}: {
  recipe: RecipeListItem;
  minutes: number | null;
  difficultyKey: string | undefined;
  difficultyLabel: string | null;
  minutesLabel: string;
  visibilityLabel: string;
  visibilityCompact?: boolean;
  showVisibility?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-3 text-xs",
        className,
      )}
    >
      {showVisibility ? (
        <RecipeVisibilityMarker
          visibility={recipe.visibility}
          label={visibilityLabel}
          compact={visibilityCompact}
        />
      ) : null}
      {recipe.servings != null ? (
        <span className="flex items-center gap-1">
          <Users className="size-3.5 shrink-0" aria-hidden />
          {recipe.servings}
        </span>
      ) : null}
      {minutes != null ? (
        <span className="flex items-center gap-1">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {minutesLabel.replace("{minutes}", String(minutes))}
        </span>
      ) : null}
      {difficultyLabel ? (
        <span
          className={cn(
            "flex items-center gap-1",
            difficultyKey &&
              difficultyKey in difficultyColorClass &&
              difficultyColorClass[
                difficultyKey as keyof typeof difficultyColorClass
              ],
          )}
        >
          <Gauge className="size-3.5 shrink-0" aria-hidden />
          {difficultyLabel}
        </span>
      ) : null}
    </div>
  );
}

function RecipeTitleBlock({
  detailHref,
  name,
  breadcrumb,
  titleClassName,
}: {
  detailHref: string;
  name: string;
  breadcrumb: string | null;
  titleClassName?: string;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <Link href={detailHref} className="hover:underline min-w-0">
        <h2
          className={cn(
            "line-clamp-2 leading-snug font-semibold",
            titleClassName ?? "text-base",
          )}
        >
          {name}
        </h2>
      </Link>
      {breadcrumb ? (
        <p className="text-muted-foreground line-clamp-1 text-xs">{breadcrumb}</p>
      ) : null}
    </div>
  );
}

function RecipeListItemGrid({
  recipe,
  currentUserId,
}: {
  recipe: RecipeListItem;
  currentUserId: string | null;
}) {
  const data = useRecipeListItemData(recipe, currentUserId);
  const visibilityMarker = (
    <RecipeVisibilityMarker
      visibility={recipe.visibility}
      label={data.visibilityLabel}
      compact
      className="bg-background/90 backdrop-blur-sm"
    />
  );

  return (
    <Card className="h-full gap-0 py-0">
      <RecipeImageBlock
        detailHref={data.detailHref}
        editHref={data.editHref}
        isOwner={data.isOwner}
        showImage={data.showImage}
        imageUrl={data.imageUrl}
        setImageError={data.setImageError}
        editLabel={data.t(data.lang.recipes.actions.edit)}
        className="aspect-square w-full"
        visibilityMarker={visibilityMarker}
      />
      <CardContent className="space-y-1 pt-3 pb-1">
        <RecipeTitleBlock
          detailHref={data.detailHref}
          name={recipe.name}
          breadcrumb={data.breadcrumb}
        />
      </CardContent>
      <CardFooter className="text-muted-foreground gap-3 border-t-0 bg-transparent py-3 text-xs">
        <RecipeMetaRow
          recipe={recipe}
          minutes={data.minutes}
          difficultyKey={data.difficultyKey}
          difficultyLabel={data.difficultyLabel}
          minutesLabel={data.t(data.lang.recipes.list.minutes)}
          visibilityLabel={data.visibilityLabel}
          showVisibility={false}
        />
      </CardFooter>
    </Card>
  );
}

function RecipeListItemList({
  recipe,
  currentUserId,
}: {
  recipe: RecipeListItem;
  currentUserId: string | null;
}) {
  const data = useRecipeListItemData(recipe, currentUserId);
  const visibilityMarker = (
    <RecipeVisibilityMarker
      visibility={recipe.visibility}
      label={data.visibilityLabel}
      compact
      className="bg-background/90 backdrop-blur-sm"
    />
  );

  return (
    <Card className="flex flex-row gap-0 overflow-hidden py-0">
      <RecipeImageBlock
        detailHref={data.detailHref}
        editHref={data.editHref}
        isOwner={data.isOwner}
        showImage={data.showImage}
        imageUrl={data.imageUrl}
        setImageError={data.setImageError}
        editLabel={data.t(data.lang.recipes.actions.edit)}
        className="aspect-square w-28 sm:w-36 md:w-40"
        visibilityMarker={visibilityMarker}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between px-4 py-3">
        <RecipeTitleBlock
          detailHref={data.detailHref}
          name={recipe.name}
          breadcrumb={data.breadcrumb}
        />
        <RecipeMetaRow
          recipe={recipe}
          minutes={data.minutes}
          difficultyKey={data.difficultyKey}
          difficultyLabel={data.difficultyLabel}
          minutesLabel={data.t(data.lang.recipes.list.minutes)}
          visibilityLabel={data.visibilityLabel}
          showVisibility={false}
          className="mt-2"
        />
      </div>
    </Card>
  );
}

function RecipeListItemCompact({
  recipe,
  currentUserId,
}: {
  recipe: RecipeListItem;
  currentUserId: string | null;
}) {
  const data = useRecipeListItemData(recipe, currentUserId);

  return (
    <div className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors">
      <RecipeImageBlock
        detailHref={data.detailHref}
        editHref={data.editHref}
        isOwner={data.isOwner}
        showImage={data.showImage}
        imageUrl={data.imageUrl}
        setImageError={data.setImageError}
        editLabel={data.t(data.lang.recipes.actions.edit)}
        className="relative size-12 overflow-hidden rounded-md"
        placeholderIconClassName="size-6"
        showEditOnImage={false}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <RecipeTitleBlock
          detailHref={data.detailHref}
          name={recipe.name}
          breadcrumb={data.breadcrumb}
          titleClassName="text-sm line-clamp-1"
        />
        <RecipeMetaRow
          recipe={recipe}
          minutes={data.minutes}
          difficultyKey={data.difficultyKey}
          difficultyLabel={data.difficultyLabel}
          minutesLabel={data.t(data.lang.recipes.list.minutes)}
          visibilityLabel={data.visibilityLabel}
          visibilityCompact
          className="shrink-0 gap-2 sm:gap-3"
        />
      </div>
      {data.isOwner ? (
        <Link
          href={data.editHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "shrink-0",
          )}
          aria-label={data.t(data.lang.recipes.actions.edit)}
        >
          <Pencil />
        </Link>
      ) : null}
    </div>
  );
}

export function RecipeListItemView({
  recipe,
  layout,
  currentUserId,
}: {
  recipe: RecipeListItem;
  layout: Exclude<RecipeListLayoutId, "table">;
  currentUserId: string | null;
}) {
  switch (layout) {
    case "list":
      return (
        <RecipeListItemList recipe={recipe} currentUserId={currentUserId} />
      );
    case "compact":
      return (
        <RecipeListItemCompact recipe={recipe} currentUserId={currentUserId} />
      );
    case "grid":
    default:
      return (
        <RecipeListItemGrid recipe={recipe} currentUserId={currentUserId} />
      );
  }
}

/** @deprecated Use RecipeListItemView */
export function RecipeListTile({
  recipe,
  currentUserId,
}: {
  recipe: RecipeListItem;
  currentUserId: string | null;
}) {
  return (
    <RecipeListItemView
      recipe={recipe}
      layout="grid"
      currentUserId={currentUserId}
    />
  );
}

export function RecipeListItemSkeleton({
  layout,
}: {
  layout: RecipeListLayoutId;
}) {
  if (layout === "list") {
    return (
      <Card className="flex flex-row gap-0 overflow-hidden py-0">
        <div className="bg-muted aspect-square w-28 shrink-0 animate-pulse sm:w-36 md:w-40" />
        <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-3">
          <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  if (layout === "compact") {
    return (
      <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
        <div className="bg-muted size-12 shrink-0 animate-pulse rounded-md" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (layout === "table") {
    return (
      <div className="flex gap-2 border-b py-2">
        <div className="bg-muted size-10 shrink-0 animate-pulse rounded" />
        <div className="bg-muted h-4 flex-1 animate-pulse rounded" />
      </div>
    );
  }

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

/** @deprecated Use RecipeListItemSkeleton */
export function RecipeListTileSkeleton() {
  return <RecipeListItemSkeleton layout="grid" />;
}
