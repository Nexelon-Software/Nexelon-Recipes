"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { localePath } from "~/lib/seo-url";
import useTranslation from "~/language/useTranslation";
import {
  RECIPE_CATEGORIES,
  RECIPE_DIFFICULTIES,
  RECIPE_UNITS,
  isCountableUnit,
  recipeDetailToRecipeInput,
  sanitizeIngredientAmountInput,
  type RecipeInput,
} from "~/server/api/routers/recipe/schemas";
import { RecipeImportButton } from "./RecipeImportButton";
import { api, type RouterOutputs } from "~/trpc/react";

type IngredientRow = RecipeInput["ingredients"][number];
type StepRow = RecipeInput["steps"][number];

const emptyIngredient = (): IngredientRow => ({
  name: "",
  amount: "",
});

const emptyStep = (): StepRow => ({
  instruction: "",
});

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[newIndex]] = [copy[newIndex]!, copy[index]!];
  return copy;
}

function optionalText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed;
}

export function RecipeForm({
  mode,
  recipeId,
  initialRecipe,
  ownerUserId,
}: {
  mode: "create" | "edit";
  recipeId?: number;
  initialRecipe?: RouterOutputs["recipe"]["getById"];
  /** Used for cancel redirect to the owner's collection. */
  ownerUserId: string;
}) {
  const router = useRouter();
  const { t, lang, locale } = useTranslation();
  const utils = api.useUtils();

  const [form, setForm] = useState<RecipeInput>(() =>
    initialRecipe
      ? recipeDetailToRecipeInput(initialRecipe)
      : {
          name: "",
          description: "",
          visibility: "public",
          ingredients: [emptyIngredient()],
          steps: [emptyStep()],
        },
  );

  const createRecipe = api.recipe.create.useMutation({
    onSuccess: async (result) => {
      await utils.recipe.invalidate();
      router.push(localePath(locale, `/recipes/${result.id}`));
    },
  });

  const updateRecipe = api.recipe.update.useMutation({
    onSuccess: async () => {
      await utils.recipe.invalidate();
      router.push(localePath(locale, `/recipes/${recipeId}`));
    },
  });

  const isPending = createRecipe.isPending || updateRecipe.isPending;

  const noneLabel = t(lang.recipes.form.none);

  const categoryItems = useMemo(
    () => [
      { label: noneLabel, value: null },
      ...RECIPE_CATEGORIES.map((category) => ({
        label: t(lang.recipes.categories[category]),
        value: category,
      })),
    ],
    [lang.recipes.categories, noneLabel, t],
  );

  const difficultyItems = useMemo(
    () => [
      { label: noneLabel, value: null },
      ...RECIPE_DIFFICULTIES.map((difficulty) => ({
        label: t(lang.recipes.difficulties[difficulty]),
        value: difficulty,
      })),
    ],
    [lang.recipes.difficulties, noneLabel, t],
  );

  const unitItems = useMemo(
    () => [
      { label: noneLabel, value: null },
      ...RECIPE_UNITS.map((unit) => ({
        label: t(lang.recipes.units[unit]),
        value: unit,
      })),
    ],
    [lang.recipes.units, noneLabel, t],
  );

  const updateField = <K extends keyof RecipeInput>(
    key: K,
    value: RecipeInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const description = optionalText(form.description);
    const cuisine = optionalText(form.cuisine);
    const notes = optionalText(form.notes);
    const payload: RecipeInput = {
      ...form,
      name: form.name.trim(),
      description,
      cuisine,
      notes,
      ingredients: form.ingredients
        .map((ingredient, index) => ({
          ...ingredient,
          name: ingredient.name.trim(),
          amount: optionalText(ingredient.amount),
          unit: ingredient.unit,
          sortOrder: index,
        }))
        .filter((ingredient) => ingredient.name.length > 0),
      steps: form.steps
        .map((step, index) => ({
          ...step,
          instruction: step.instruction.trim(),
          sortOrder: index,
        }))
        .filter((step) => step.instruction.length > 0),
    };

    if (payload.ingredients.length === 0 || payload.steps.length === 0) {
      return;
    }

    if (mode === "create") {
      createRecipe.mutate(payload);
      return;
    }

    if (recipeId) {
      updateRecipe.mutate({ id: recipeId, data: payload });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8 px-3 py-6 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {t(
            mode === "create"
              ? lang.recipes.form.createTitle
              : lang.recipes.form.editTitle,
          )}
        </h1>
        {mode === "create" ? (
          <RecipeImportButton
            hasExistingContent={form.name.trim().length > 0}
            onImport={setForm}
          />
        ) : null}
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t(lang.recipes.form.name)}</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder={t(lang.recipes.form.namePlaceholder)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t(lang.recipes.form.description)}</Label>
          <textarea
            id="description"
            value={form.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder={t(lang.recipes.form.descriptionPlaceholder)}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-md border px-4 py-3">
          <div className="space-y-1">
            <Label htmlFor="visibility">
              {t(
                form.visibility === "public"
                  ? lang.recipes.visibility.labelPublic
                  : lang.recipes.visibility.labelPrivate,
              )}
            </Label>
            <p className="text-muted-foreground text-sm">
              {t(
                form.visibility === "public"
                  ? lang.recipes.visibility.hintPublic
                  : lang.recipes.visibility.hintPrivate,
              )}
            </p>
          </div>
          <Switch
            id="visibility"
            checked={form.visibility === "public"}
            onCheckedChange={(checked) =>
              updateField("visibility", checked ? "public" : "private")
            }
            aria-labelledby="visibility"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">{t(lang.recipes.form.category)}</Label>
            <Select
              items={categoryItems}
              value={form.category ?? null}
              onValueChange={(value) =>
                updateField(
                  "category",
                  value ? (value as RecipeInput["category"]) : undefined,
                )
              }
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue
                  placeholder={t(lang.recipes.form.categoryPlaceholder)}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categoryItems.map((item) => (
                    <SelectItem
                      key={item.value ?? "__none__"}
                      value={item.value}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">{t(lang.recipes.form.difficulty)}</Label>
            <Select
              items={difficultyItems}
              value={form.difficulty ?? null}
              onValueChange={(value) =>
                updateField(
                  "difficulty",
                  value ? (value as RecipeInput["difficulty"]) : undefined,
                )
              }
            >
              <SelectTrigger id="difficulty" className="w-full">
                <SelectValue
                  placeholder={t(lang.recipes.form.difficultyPlaceholder)}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {difficultyItems.map((item) => (
                    <SelectItem
                      key={item.value ?? "__none__"}
                      value={item.value}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuisine">{t(lang.recipes.form.cuisine)}</Label>
            <Input
              id="cuisine"
              value={form.cuisine ?? ""}
              onChange={(event) => updateField("cuisine", event.target.value)}
              placeholder={t(lang.recipes.form.cuisinePlaceholder)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="servings">{t(lang.recipes.form.servings)}</Label>
            <Input
              id="servings"
              type="number"
              min={1}
              value={form.servings ?? ""}
              onChange={(event) =>
                updateField(
                  "servings",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prepTimeMinutes">
              {t(lang.recipes.form.prepTimeMinutes)}
            </Label>
            <Input
              id="prepTimeMinutes"
              type="number"
              min={1}
              value={form.prepTimeMinutes ?? ""}
              onChange={(event) =>
                updateField(
                  "prepTimeMinutes",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cookTimeMinutes">
              {t(lang.recipes.form.cookTimeMinutes)}
            </Label>
            <Input
              id="cookTimeMinutes"
              type="number"
              min={1}
              value={form.cookTimeMinutes ?? ""}
              onChange={(event) =>
                updateField(
                  "cookTimeMinutes",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">{t(lang.recipes.form.imageUrl)}</Label>
          <Input
            id="imageUrl"
            type="url"
            value={form.imageUrl ?? ""}
            onChange={(event) => updateField("imageUrl", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sourceUrl">{t(lang.recipes.form.sourceUrl)}</Label>
          <Input
            id="sourceUrl"
            type="url"
            value={form.sourceUrl ?? ""}
            onChange={(event) => updateField("sourceUrl", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">{t(lang.recipes.form.notes)}</Label>
          <textarea
            id="notes"
            value={form.notes ?? ""}
            onChange={(event) => updateField("notes", event.target.value)}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{t(lang.recipes.form.ingredients)}</h2>
        {form.ingredients.map((ingredient, index) => (
          <div
            key={`ingredient-${index}`}
            className="border-border grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_120px_120px_auto]"
          >
            <div className="space-y-2">
              <Label>{t(lang.recipes.form.ingredientName)}</Label>
              <Input
                value={ingredient.name}
                onChange={(event) => {
                  const ingredients = [...form.ingredients];
                  ingredients[index] = {
                    ...ingredients[index]!,
                    name: event.target.value,
                  };
                  updateField("ingredients", ingredients);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t(lang.recipes.form.ingredientAmount)}</Label>
              <Input
                type="text"
                inputMode={
                  ingredient.unit === undefined
                    ? "text"
                    : isCountableUnit(ingredient.unit)
                      ? "numeric"
                      : "decimal"
                }
                value={ingredient.amount ?? ""}
                onChange={(event) => {
                  const ingredients = [...form.ingredients];
                  ingredients[index] = {
                    ...ingredients[index]!,
                    amount: sanitizeIngredientAmountInput(
                      event.target.value,
                      ingredients[index]!.unit,
                    ),
                  };
                  updateField("ingredients", ingredients);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`ingredient-unit-${index}`}>
                {t(lang.recipes.form.ingredientUnit)}
              </Label>
              <Select
                items={unitItems}
                value={ingredient.unit ?? null}
                onValueChange={(value) => {
                  const nextUnit = value ?? undefined;
                  const ingredients = [...form.ingredients];
                  const current = ingredients[index]!;
                  ingredients[index] = {
                    ...current,
                    unit: nextUnit,
                    amount: sanitizeIngredientAmountInput(
                      current.amount ?? "",
                      nextUnit,
                    ),
                  };
                  updateField("ingredients", ingredients);
                }}
              >
                <SelectTrigger
                  id={`ingredient-unit-${index}`}
                  className="w-full"
                >
                  <SelectValue
                    placeholder={t(lang.recipes.form.ingredientUnit)}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {unitItems.map((item) => (
                      <SelectItem
                        key={item.value ?? "__none__"}
                        value={item.value}
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={index === 0}
                onClick={() =>
                  updateField("ingredients", moveItem(form.ingredients, index, -1))
                }
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={index === form.ingredients.length - 1}
                onClick={() =>
                  updateField("ingredients", moveItem(form.ingredients, index, 1))
                }
              >
                ↓
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={form.ingredients.length === 1}
                onClick={() =>
                  updateField(
                    "ingredients",
                    form.ingredients.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                {t(lang.recipes.form.removeIngredient)}
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            updateField("ingredients", [...form.ingredients, emptyIngredient()])
          }
        >
          {t(lang.recipes.form.addIngredient)}
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{t(lang.recipes.form.steps)}</h2>
        {form.steps.map((step, index) => (
          <div
            key={`step-${index}`}
            className="border-border space-y-3 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{index + 1}.</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={index === 0}
                  onClick={() =>
                    updateField("steps", moveItem(form.steps, index, -1))
                  }
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={index === form.steps.length - 1}
                  onClick={() =>
                    updateField("steps", moveItem(form.steps, index, 1))
                  }
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={form.steps.length === 1}
                  onClick={() =>
                    updateField(
                      "steps",
                      form.steps.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  {t(lang.recipes.form.removeStep)}
                </Button>
              </div>
            </div>
            <textarea
              value={step.instruction}
              onChange={(event) => {
                const steps = [...form.steps];
                steps[index] = {
                  ...steps[index]!,
                  instruction: event.target.value,
                };
                updateField("steps", steps);
              }}
              placeholder={t(lang.recipes.form.stepInstruction)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => updateField("steps", [...form.steps, emptyStep()])}
        >
          {t(lang.recipes.form.addStep)}
        </Button>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? t(lang.recipes.actions.saving) : t(lang.recipes.actions.save)}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              localePath(
                locale,
                mode === "edit" && recipeId
                  ? `/recipes/${recipeId}`
                  : `/${ownerUserId}/recipes`,
              ),
            )
          }
        >
          {t(lang.recipes.actions.cancel)}
        </Button>
      </div>
    </form>
  );
}
