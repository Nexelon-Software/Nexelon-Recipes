import { createHash, randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "~/server/db";
import { apiKeys } from "~/server/db/schema";

export const API_KEY_PREFIX = "nxr_";
export const MAX_ACTIVE_API_KEYS = 10;
export const API_KEY_NAME_MAX_LENGTH = 64;

/** SHA-256 hex digest of a plaintext API key. */
export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

/** Generate a new plaintext key (`nxr_` + base64url) and its stored metadata. */
export function generateApiKey(): {
  plaintext: string;
  keyHash: string;
  keyPrefix: string;
} {
  const secret = randomBytes(32).toString("base64url");
  const plaintext = `${API_KEY_PREFIX}${secret}`;
  const keyHash = hashApiKey(plaintext);
  const keyPrefix = plaintext.slice(0, 12);
  return { plaintext, keyHash, keyPrefix };
}

function parseBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

/**
 * Resolve an Authorization Bearer API key to its owner.
 * Updates `lastUsedAt` on success. Returns null when missing, invalid, or revoked.
 */
export async function authenticateApiKey(
  authorizationHeader: string | null,
): Promise<{ apiKeyId: number; userId: string } | null> {
  const plaintext = parseBearerToken(authorizationHeader);
  if (!plaintext) return null;

  const keyHash = hashApiKey(plaintext);
  const row = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)),
    columns: { id: true, userId: true },
  });

  if (!row) return null;

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id));

  return { apiKeyId: row.id, userId: row.userId };
}
