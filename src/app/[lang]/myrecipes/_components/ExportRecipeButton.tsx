"use client";

import { Download } from "lucide-react";

import { Button } from "~/components/ui/button";
import useTranslation from "~/language/useTranslation";
import {
  recipeInputToExportEnvelope,
  type RecipeInput,
} from "~/server/api/routers/recipe/schemas";

function recipeExportFilename(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `${slug}.recipe.json` : "recipe.json";
}

export function ExportRecipeButton({ recipe }: { recipe: RecipeInput }) {
  const { t, lang } = useTranslation();

  const handleExport = () => {
    const envelope = recipeInputToExportEnvelope(recipe);
    const json = JSON.stringify(envelope, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = recipeExportFilename(recipe.name);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExport}>
      <Download className="size-4" />
      {t(lang.recipes.export.exportJson)}
    </Button>
  );
}
