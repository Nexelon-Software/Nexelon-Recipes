"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import useTranslation from "~/language/useTranslation";
import { api } from "~/trpc/react";

export function DeleteRecipeButton({
  recipeId,
  redirectPath,
}: {
  recipeId: number;
  redirectPath: string;
}) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const utils = api.useUtils();
  const [confirming, setConfirming] = useState(false);

  const deleteRecipe = api.recipe.delete.useMutation({
    onSuccess: async () => {
      await utils.recipe.invalidate();
      router.push(redirectPath);
    },
  });

  if (confirming) {
    return (
      <div className="border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-medium">{t(lang.recipes.actions.deleteConfirm)}</p>
          <p className="text-muted-foreground text-sm">
            {t(lang.recipes.actions.deleteConfirmDescription)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteRecipe.isPending}
            onClick={() => deleteRecipe.mutate({ id: recipeId })}
          >
            {deleteRecipe.isPending
              ? t(lang.recipes.actions.deleting)
              : t(lang.recipes.actions.delete)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={deleteRecipe.isPending}
            onClick={() => setConfirming(false)}
          >
            {t(lang.recipes.actions.cancel)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
      {t(lang.recipes.actions.delete)}
    </Button>
  );
}
