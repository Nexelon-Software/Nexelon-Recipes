import { TRPCError } from "@trpc/server";
import { asc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { foods } from "~/server/db/schema";

const foodListColumns = {
  id: true,
  source: true,
  externalId: true,
  sourceVersion: true,
  name: true,
  nameEn: true,
  language: true,
  foodGroup: true,
  caloriesKcalPer100g: true,
  proteinGPer100g: true,
  carbsGPer100g: true,
  fatGPer100g: true,
} as const;

export const foodRouter = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().min(1),
        limit: z.number().int().min(1).max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const pattern = `%${input.query}%`;

      return ctx.db.query.foods.findMany({
        where: or(ilike(foods.name, pattern), ilike(foods.nameEn, pattern)),
        columns: foodListColumns,
        orderBy: [asc(foods.name)],
        limit,
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const food = await ctx.db.query.foods.findFirst({
        where: eq(foods.id, input.id),
        columns: {
          ...foodListColumns,
          densityGPerMl: true,
          gramsPerPiece: true,
          gramsPerHead: true,
          importedAt: true,
          updatedAt: true,
        },
      });

      if (!food) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return food;
    }),
});
