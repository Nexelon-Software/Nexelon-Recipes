import type { Session } from "./config";
import { auth } from "./config";

/** Matches `better-auth.session_data` and chunked `__Secure-` / `__Host-` variants. */
const SESSION_DATA_COOKIE = /(?:^|;\s*)(?:__Secure-|__Host-)?better-auth\.session_data(?:\.\d+)?=/;

function hasSessionToken(cookieHeader: string): boolean {
  return /(?:^|;\s*)(?:__Secure-|__Host-)?better-auth\.session_token=/.test(
    cookieHeader,
  );
}

function hasSessionData(cookieHeader: string): boolean {
  return SESSION_DATA_COOKIE.test(cookieHeader);
}

/** Drop cache cookies so getSession can fall back to the DB session_token. */
function stripSessionDataCookies(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part.length > 0 &&
        !/^(?:__Secure-|__Host-)?better-auth\.session_data(?:\.\d+)?=/.test(
          part,
        ),
    )
    .join("; ");
}

async function getSessionOnce(
  requestHeaders: Headers,
): Promise<Session | null> {
  try {
    return await auth.api.getSession({ headers: requestHeaders });
  } catch {
    // Stale/corrupt session_data (wrong strategy, bad base64) must not 500.
    return null;
  }
}

/**
 * Resolve the current session, recovering from expired/corrupt `session_data`
 * cookie cache (better-auth JWE/JWT bug: returns null without DB fallback).
 *
 * @see https://github.com/better-auth/better-auth/issues/10021
 */
export async function resolveSession(
  requestHeaders: Headers,
): Promise<Session | null> {
  const session = await getSessionOnce(requestHeaders);
  if (session?.user) return session;

  const cookieHeader = requestHeaders.get("cookie");
  if (
    !cookieHeader ||
    !hasSessionToken(cookieHeader) ||
    !hasSessionData(cookieHeader)
  ) {
    return session;
  }

  const cleaned = new Headers(requestHeaders);
  cleaned.set("cookie", stripSessionDataCookies(cookieHeader));
  return getSessionOnce(cleaned);
}
