import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, inArray, ne, or } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import type { db } from "~/server/db";
import { user, userFollows } from "~/server/db/schema";

const UserIdInput = z.object({ userId: z.string().min(1) });

const OptionalUserIdInput = z
  .object({
    userId: z.string().min(1).optional(),
  })
  .optional();

async function assertUserExists(
  database: typeof db,
  userId: string,
): Promise<void> {
  const existing = await database.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true },
  });

  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
}

function resolveTargetUserId(
  sessionUserId: string,
  input?: z.infer<typeof OptionalUserIdInput>,
): string {
  return input?.userId ?? sessionUserId;
}

export const followRouter = createTRPCRouter({
  follow: protectedProcedure
    .input(UserIdInput)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      await assertUserExists(ctx.db, input.userId);

      const existing = await ctx.db.query.userFollows.findFirst({
        where: and(
          eq(userFollows.followerId, ctx.session.user.id),
          eq(userFollows.followingId, input.userId),
        ),
        columns: { id: true },
      });

      if (existing) {
        return { userId: input.userId };
      }

      const [created] = await ctx.db
        .insert(userFollows)
        .values({
          followerId: ctx.session.user.id,
          followingId: input.userId,
        })
        .returning({ id: userFollows.id });

      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return { userId: input.userId };
    }),

  unfollow: protectedProcedure
    .input(UserIdInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.session.user.id),
            eq(userFollows.followingId, input.userId),
          ),
        );

      return { userId: input.userId };
    }),

  getStatus: protectedProcedure
    .input(UserIdInput)
    .query(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        return { isFollowing: false };
      }

      const existing = await ctx.db.query.userFollows.findFirst({
        where: and(
          eq(userFollows.followerId, ctx.session.user.id),
          eq(userFollows.followingId, input.userId),
        ),
        columns: { id: true },
      });

      return { isFollowing: Boolean(existing) };
    }),

  listFollowing: protectedProcedure
    .input(OptionalUserIdInput)
    .query(async ({ ctx, input }) => {
      const targetUserId = resolveTargetUserId(ctx.session.user.id, input);

      if (targetUserId !== ctx.session.user.id) {
        await assertUserExists(ctx.db, targetUserId);
      }

      const rows = await ctx.db.query.userFollows.findMany({
        where: eq(userFollows.followerId, targetUserId),
        orderBy: [desc(userFollows.createdAt)],
        with: {
          following: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return rows.map((row) => ({
        id: row.following.id,
        name: row.following.name,
        image: row.following.image,
        followedAt: row.createdAt,
      }));
    }),

  listFollowers: protectedProcedure
    .input(OptionalUserIdInput)
    .query(async ({ ctx, input }) => {
      const targetUserId = resolveTargetUserId(ctx.session.user.id, input);

      if (targetUserId !== ctx.session.user.id) {
        await assertUserExists(ctx.db, targetUserId);
      }

      const rows = await ctx.db.query.userFollows.findMany({
        where: eq(userFollows.followingId, targetUserId),
        orderBy: [desc(userFollows.createdAt)],
        with: {
          follower: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return rows.map((row) => ({
        id: row.follower.id,
        name: row.follower.name,
        image: row.follower.image,
        followedAt: row.createdAt,
      }));
    }),

  searchPeople: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sessionUserId = ctx.session.user.id;
      const search = input.search?.trim();
      const hasSearch = Boolean(search && search.length >= 3);
      const pattern = hasSearch ? `%${search}%` : undefined;

      const users = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          image: user.image,
        })
        .from(user)
        .where(
          and(
            ne(user.id, sessionUserId),
            hasSearch && pattern
              ? or(ilike(user.name, pattern), ilike(user.email, pattern))
              : undefined,
          ),
        )
        .orderBy(asc(user.name))
        .limit(input.limit);

      if (users.length === 0) {
        return [];
      }

      const userIds = users.map((row) => row.id);
      const followRows = await ctx.db
        .select({ followingId: userFollows.followingId })
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, sessionUserId),
            inArray(userFollows.followingId, userIds),
          ),
        );

      const followingSet = new Set(followRows.map((row) => row.followingId));

      return users.map((row) => ({
        id: row.id,
        name: row.name,
        image: row.image,
        isFollowing: followingSet.has(row.id),
      }));
    }),

  getCounts: protectedProcedure
    .input(OptionalUserIdInput)
    .query(async ({ ctx, input }) => {
      const targetUserId = resolveTargetUserId(ctx.session.user.id, input);

      if (targetUserId !== ctx.session.user.id) {
        await assertUserExists(ctx.db, targetUserId);
      }

      const [followingResult] = await ctx.db
        .select({ count: count() })
        .from(userFollows)
        .where(eq(userFollows.followerId, targetUserId));

      const [followersResult] = await ctx.db
        .select({ count: count() })
        .from(userFollows)
        .where(eq(userFollows.followingId, targetUserId));

      return {
        following: followingResult?.count ?? 0,
        followers: followersResult?.count ?? 0,
      };
    }),
});
