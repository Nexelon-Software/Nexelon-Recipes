import { auth } from ".";
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    // Stale or corrupt `better-auth.session_data` (e.g. wrong cache strategy) must not 500 pages.
    return null;
  }
});
