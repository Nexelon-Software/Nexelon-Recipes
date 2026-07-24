"use client";

import { FileJson, FileText } from "lucide-react";

import { Button } from "~/components/ui/button";
import useTranslation from "~/language/useTranslation";
import {
  recipeDetailToRecipeInput,
  recipeInputsToCollectionEnvelope,
  recipeInputsToMarkdown,
} from "~/server/api/routers/recipe/schemas";
import { api } from "~/trpc/react";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function collectionFilename(displayName: string, extension: string): string {
  const slug = displayName
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  const base = slug || "recipes";
  return `${base}.${extension}`;
}

export function ExportUserRecipesButtons({
  userId,
  displayName,
  collectionTitle,
}: {
  userId: string;
  displayName: string;
  collectionTitle: string;
}) {
  const { t, lang } = useTranslation();
  const exportQuery = api.recipe.listForExport.useQuery(
    { userId },
    { enabled: false },
  );

  const runExport = async (format: "markdown" | "json") => {
    const result = await exportQuery.refetch();
    if (result.error || !result.data) {
      return;
    }

    const inputs = result.data.map((recipe) =>
      recipeDetailToRecipeInput(recipe),
    );

    if (format === "markdown") {
      const markdown = recipeInputsToMarkdown(inputs, collectionTitle);
      downloadBlob(
        new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
        collectionFilename(displayName, "md"),
      );
      return;
    }

    const envelope = recipeInputsToCollectionEnvelope(inputs);
    downloadBlob(
      new Blob([JSON.stringify(envelope, null, 2)], {
        type: "application/json",
      }),
      collectionFilename(displayName, "recipes.json"),
    );
  };

  const pending = exportQuery.isFetching;

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={pending}
        aria-label={t(lang.recipes.export.exportMarkdown)}
        title={t(lang.recipes.export.exportMarkdown)}
        onClick={() => void runExport("markdown")}
      >
        <FileText className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={pending}
        aria-label={t(lang.recipes.export.exportJsonCollection)}
        title={t(lang.recipes.export.exportJsonCollection)}
        onClick={() => void runExport("json")}
      >
        <FileJson className="size-4" />
      </Button>
    </div>
  );
}
