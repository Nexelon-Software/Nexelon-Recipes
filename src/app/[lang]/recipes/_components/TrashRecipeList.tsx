"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "~/components/ui/button";
import { localePath } from "~/lib/seo-url";
import { cn } from "~/lib/utils";
import useTranslation from "~/language/useTranslation";
import { api } from "~/trpc/react";

export function TrashRecipeList({ userId }: { userId: string }) {
  const { t, lang, locale } = useTranslation();
  const utils = api.useUtils();
  const listQuery = api.recipe.listDeleted.useQuery();
  const [confirmPermanentId, setConfirmPermanentId] = useState<number | null>(
    null,
  );

  const restore = api.recipe.restore.useMutation({
    onSuccess: async () => {
      toast.success(t(lang.recipes.trash.restoreSuccess));
      await utils.recipe.invalidate();
    },
    onError: () => {
      toast.error(t(lang.recipes.trash.restoreError));
    },
  });

  const permanentDelete = api.recipe.permanentDelete.useMutation({
    onSuccess: async () => {
      setConfirmPermanentId(null);
      toast.success(t(lang.recipes.trash.permanentDeleteSuccess));
      await utils.recipe.invalidate();
    },
    onError: () => {
      toast.error(t(lang.recipes.trash.permanentDeleteError));
    },
  });

  const busy = restore.isPending || permanentDelete.isPending;
  const recipes = listQuery.data ?? [];
  const myRecipesPath = localePath(locale, `/${userId}/recipes`);

  return (
    <div className="container mx-auto space-y-6 px-3 py-6 sm:px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold">
          <Trash2 className="size-6 shrink-0" aria-hidden />
          {t(lang.recipes.trash.title)}
        </h1>
        <Link
          href={myRecipesPath}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t(lang.recipes.trash.backToRecipes)}
        </Link>
      </div>

      {listQuery.isLoading ? null : recipes.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t(lang.recipes.trash.empty)}
        </p>
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => {
            const confirming = confirmPermanentId === recipe.id;
            return (
              <li
                key={recipe.id}
                className="border-border space-y-3 rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{recipe.name}</p>
                    {recipe.category ? (
                      <p className="text-muted-foreground text-sm">
                        {recipe.category}
                      </p>
                    ) : null}
                  </div>
                </div>

                {confirming ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <p className="font-medium">
                        {t(lang.recipes.trash.permanentDeleteConfirm)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {t(
                          lang.recipes.trash.permanentDeleteConfirmDescription,
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() =>
                          permanentDelete.mutate({ id: recipe.id })
                        }
                      >
                        {permanentDelete.isPending
                          ? t(lang.recipes.trash.permanentDeleting)
                          : t(lang.recipes.trash.permanentDelete)}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setConfirmPermanentId(null)}
                      >
                        {t(lang.recipes.actions.cancel)}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => restore.mutate({ id: recipe.id })}
                    >
                      {restore.isPending
                        ? t(lang.recipes.trash.restoring)
                        : t(lang.recipes.trash.restore)}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={() => setConfirmPermanentId(recipe.id)}
                    >
                      {t(lang.recipes.trash.permanentDelete)}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
