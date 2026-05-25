import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import type { db } from "~/server/db";
import {
  recipeIngredients,
  recipes,
  recipeSteps,
} from "~/server/db/schema";

import { RecipeInputSchema } from "./recipe/schemas";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase();
}

function withSortOrder<T extends { sortOrder?: number }>(
  items: T[],
): Array<T & { sortOrder: number }> {
  return items.map((item, index) => ({
    ...item,
    sortOrder: item.sortOrder ?? index,
  }));
}

async function insertChildRows(
  tx: DbTransaction,
  recipeId: number,
  input: z.infer<typeof RecipeInputSchema>,
) {
  const ingredients = withSortOrder(input.ingredients);
  const steps = withSortOrder(input.steps);

  if (ingredients.length > 0) {
    await tx.insert(recipeIngredients).values(
      ingredients.map((ingredient) => ({
        recipeId,
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        sortOrder: ingredient.sortOrder,
      })),
    );
  }

  if (steps.length > 0) {
    await tx.insert(recipeSteps).values(
      steps.map((step) => ({
        recipeId,
        instruction: step.instruction,
        sortOrder: step.sortOrder,
      })),
    );
  }
}

async function replaceChildRows(
  tx: DbTransaction,
  recipeId: number,
  input: z.infer<typeof RecipeInputSchema>,
) {
  await tx
    .delete(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, recipeId));
  await tx.delete(recipeSteps).where(eq(recipeSteps.recipeId, recipeId));
  await insertChildRows(tx, recipeId, input);
}

export const recipeRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const search = input?.search?.trim();
      const rows = await ctx.db.query.recipes.findMany({
        where: and(
          eq(recipes.deleted, false),
          eq(recipes.createdById, ctx.session.user.id),
        ),
        orderBy: [desc(recipes.updatedAt)],
        columns: {
          id: true,
          name: true,
          category: true,
          cuisine: true,
          difficulty: true,
          prepTimeMinutes: true,
          cookTimeMinutes: true,
          servings: true,
          imageUrl: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!search || search.length < 3) {
        return rows;
      }

      const needle = normalizeForSearch(search);
      return rows.filter((recipe) =>
        normalizeForSearch(recipe.name).includes(needle),
      );
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const recipe = await ctx.db.query.recipes.findFirst({
        where: and(
          eq(recipes.id, input.id),
          eq(recipes.deleted, false),
          eq(recipes.createdById, ctx.session.user.id),
        ),
        with: {
          ingredients: {
            orderBy: [asc(recipeIngredients.sortOrder)],
          },
          steps: {
            orderBy: [asc(recipeSteps.sortOrder)],
          },
        },
      });

      if (!recipe) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return recipe;
    }),

  create: protectedProcedure
    .input(RecipeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const recipeId = await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(recipes)
          .values({
            name: input.name,
            description: input.description,
            category: input.category,
            cuisine: input.cuisine,
            difficulty: input.difficulty,
            prepTimeMinutes: input.prepTimeMinutes,
            cookTimeMinutes: input.cookTimeMinutes,
            servings: input.servings,
            imageUrl: input.imageUrl,
            notes: input.notes,
            sourceUrl: input.sourceUrl,
            createdById: ctx.session.user.id,
          })
          .returning({ id: recipes.id });

        if (!created) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }

        await insertChildRows(tx, created.id, input);
        return created.id;
      });

      return { id: recipeId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: RecipeInputSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.recipes.findFirst({
        where: and(eq(recipes.id, input.id), eq(recipes.deleted, false)),
        columns: { id: true, createdById: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existing.createdById !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(recipes)
          .set({
            name: input.data.name,
            description: input.data.description,
            category: input.data.category,
            cuisine: input.data.cuisine,
            difficulty: input.data.difficulty,
            prepTimeMinutes: input.data.prepTimeMinutes,
            cookTimeMinutes: input.data.cookTimeMinutes,
            servings: input.data.servings,
            imageUrl: input.data.imageUrl,
            notes: input.data.notes,
            sourceUrl: input.data.sourceUrl,
          })
          .where(eq(recipes.id, input.id));

        await replaceChildRows(tx, input.id, input.data);
      });

      return { id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.recipes.findFirst({
        where: and(eq(recipes.id, input.id), eq(recipes.deleted, false)),
        columns: { id: true, createdById: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existing.createdById !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .update(recipes)
        .set({ deleted: true })
        .where(eq(recipes.id, input.id));

      return { id: input.id };
    }),
});
