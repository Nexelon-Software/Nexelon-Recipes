import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

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
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
