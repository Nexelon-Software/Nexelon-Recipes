import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import {
  API_KEY_NAME_MAX_LENGTH,
  generateApiKey,
  MAX_ACTIVE_API_KEYS,
} from "~/server/api-keys";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { apiKeys } from "~/server/db/schema";

const ApiKeyNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(API_KEY_NAME_MAX_LENGTH);

export const apiKeyRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, ctx.session.user.id),
      orderBy: [desc(apiKeys.createdAt)],
      columns: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    });
  }),

  create: protectedProcedure
    .input(z.object({ name: ApiKeyNameSchema }))
    .mutation(async ({ ctx, input }) => {
      const active = await ctx.db.query.apiKeys.findMany({
        where: and(
          eq(apiKeys.userId, ctx.session.user.id),
          isNull(apiKeys.revokedAt),
        ),
        columns: { id: true },
      });

      if (active.length >= MAX_ACTIVE_API_KEYS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "active_key_limit",
        });
      }

      const { plaintext, keyHash, keyPrefix } = generateApiKey();

      const [created] = await ctx.db
        .insert(apiKeys)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          keyHash,
          keyPrefix,
        })
        .returning({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          createdAt: apiKeys.createdAt,
        });

      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return {
        ...created,
        key: plaintext,
      };
    }),

  rename: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: ApiKeyNameSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.apiKeys.findFirst({
        where: and(
          eq(apiKeys.id, input.id),
          eq(apiKeys.userId, ctx.session.user.id),
        ),
        columns: { id: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db
        .update(apiKeys)
        .set({ name: input.name })
        .where(eq(apiKeys.id, input.id));

      return { id: input.id };
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.apiKeys.findFirst({
        where: and(
          eq(apiKeys.id, input.id),
          eq(apiKeys.userId, ctx.session.user.id),
        ),
        columns: { id: true, revokedAt: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existing.revokedAt) {
        return { id: input.id };
      }

      await ctx.db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.id));

      return { id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.apiKeys.findFirst({
        where: and(
          eq(apiKeys.id, input.id),
          eq(apiKeys.userId, ctx.session.user.id),
        ),
        columns: { id: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.delete(apiKeys).where(eq(apiKeys.id, input.id));

      return { id: input.id };
    }),
});
