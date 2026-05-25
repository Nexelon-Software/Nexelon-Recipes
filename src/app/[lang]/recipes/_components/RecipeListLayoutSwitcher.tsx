"use client";

import { AlignJustify, LayoutGrid, List, Table } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DEFAULT_RECIPE_LIST_LAYOUT,
  RECIPE_LIST_LAYOUTS,
  type RecipeListLayoutId,
} from "~/lib/recipe-list-layout";
import { cn } from "~/lib/utils";
import useTranslation from "~/language/useTranslation";

const layoutIcons: Record<RecipeListLayoutId, typeof LayoutGrid> = {
  grid: LayoutGrid,
  list: List,
  compact: AlignJustify,
  table: Table,
};

export function RecipeListLayoutSwitcher({
  layout,
  onLayoutChange,
  mounted,
}: {
  layout: RecipeListLayoutId;
  onLayoutChange: (id: RecipeListLayoutId) => void;
  mounted: boolean;
}) {
  const { t, lang } = useTranslation();
  const activeLayout = mounted ? layout : DEFAULT_RECIPE_LIST_LAYOUT;

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5"
      role="group"
      aria-label={t(lang.recipes.viewLayout.label)}
    >
      {RECIPE_LIST_LAYOUTS.map(({ id }) => {
        const Icon = layoutIcons[id];
        const label = t(lang.recipes.viewLayout[id]);
        return (
          <Button
            key={id}
            type="button"
            variant={activeLayout === id ? "secondary" : "ghost"}
            size="icon-sm"
            className={cn("size-8 shrink-0")}
            aria-pressed={activeLayout === id}
            aria-label={label}
            title={label}
            disabled={!mounted}
            onClick={() => onLayoutChange(id)}
          >
            <Icon className="size-4" aria-hidden />
          </Button>
        );
      })}
    </div>
  );
}
