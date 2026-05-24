import { createAuthClient } from "better-auth/react";

function getAuthBaseURL() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SERVER_URL;
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
});

export type Session = typeof authClient.$Infer.Session;
