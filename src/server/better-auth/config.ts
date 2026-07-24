import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { env } from "~/env";
import { db } from "~/server/db";

const isDev = env.NODE_ENV === "development";

/** LAN + nip.io hosts for phone testing (Google OAuth rejects raw IP redirect URIs). */
const devAllowedHosts = [
  "localhost",
  "localhost:*",
  "127.0.0.1",
  "127.0.0.1:*",
  "192.168.1.113",
  "192.168.1.113:*",
  "*.nip.io",
];

export const auth = betterAuth({
  baseURL: isDev
    ? {
        allowedHosts: devAllowedHosts,
        protocol: "http",
        fallback: env.NEXT_PUBLIC_SERVER_URL,
      }
    : env.NEXT_PUBLIC_SERVER_URL,
  // Dynamic allowedHosts only auto-trusts http:// for loopback; LAN needs explicit origins.
  trustedOrigins: isDev
    ? [
        env.NEXT_PUBLIC_SERVER_URL,
        "http://192.168.1.113:3000",
        "http://192.168.1.113.nip.io:3000",
        "http://*.nip.io",
      ]
    : undefined,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  session: {
    // Prefer `compact` over `jwe`/`jwt`: expired JWE cache cookies used to make
    // getSession return null without falling back to the DB session_token
    // (better-auth#10021). Compact treats expiry as a cache miss.
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh expiry at most once per day when used
    cookieCache: {
      enabled: true,
      strategy: "compact",
      maxAge: 5 * 60,
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  // Must be last so Set-Cookie from auth.api.* reaches Next.js cookies().
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
