"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import useTranslation from "~/language/useTranslation";
import {
  parseRecipeJsonFile,
  RecipeJsonParseError,
  type RecipeInput,
} from "~/server/api/routers/recipe/schemas";

export function RecipeImportButton({
  onImport,
  hasExistingContent,
}: {
  onImport: (recipe: RecipeInput) => void;
  hasExistingContent: boolean;
}) {
  const { t, lang } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (hasExistingContent) {
      const confirmed = window.confirm(
        t(lang.recipes.import.importReplaceConfirm),
      );
      if (!confirmed) return;
    }

    try {
      const text = await file.text();
      const recipe = parseRecipeJsonFile(text);
      onImport(recipe);
      toast.success(t(lang.recipes.import.importSuccess));
    } catch (error) {
      if (error instanceof RecipeJsonParseError) {
        if (error.code === "invalid_json") {
          toast.error(t(lang.recipes.import.importInvalidJson));
          return;
        }
        toast.error(t(lang.recipes.import.importValidationFailed), {
          description: error.message,
        });
        return;
      }
      toast.error(t(lang.recipes.import.importInvalidJson));
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" />
        {t(lang.recipes.import.importJson)}
      </Button>
    </>
  );
}
