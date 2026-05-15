"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { RecipeIngredient } from "~/types/recipe";

function formatScaledQuantity(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "";

  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);

  // show up to 2 decimals, trim trailing zeros
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function IngredientsWithPortions({
  baseServings,
  ingredients,
  labels,
}: {
  baseServings: number;
  ingredients: RecipeIngredient[];
  labels: {
    portions: string;
    reset: string;
  };
}) {
  const [servings, setServings] = useState<number>(baseServings);

  const factor = servings / baseServings;

  const scaledIngredients = useMemo(() => {
    return ingredients.map((ing) => {
      if (ing.quantity === null) return { ing, amount: "" };

      const scaled = ing.quantity * factor;
      const qty = formatScaledQuantity(scaled);
      const unit = ing.unit ?? "";
      const amount = [qty, unit].filter(Boolean).join(" ");
      return { ing, amount };
    });
  }, [ingredients, factor]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {labels.portions}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setServings((s) => clampInt(s - 1, 1, 999))}
            aria-label="-"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Input
            inputMode="numeric"
            type="number"
            min={1}
            max={999}
            className="w-24 tabular-nums"
            value={servings}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              setServings(clampInt(Math.trunc(next), 1, 999));
            }}
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setServings((s) => clampInt(s + 1, 1, 999))}
            aria-label="+"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setServings(baseServings)}
            disabled={servings === baseServings}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {labels.reset}
          </Button>
        </div>
      </div>

      {ingredients.length === 0 ? null : (
        <ul className="divide-y">
          {scaledIngredients.map(({ ing, amount }, idx) => (
            <li
              key={`${ing.name}-${idx}`}
              className="flex items-start justify-between gap-3 py-2.5"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{ing.name}</span>
                {ing.notes ? (
                  <span className="text-muted-foreground text-xs">
                    {ing.notes}
                  </span>
                ) : null}
              </div>
              {amount ? (
                <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                  {amount}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

