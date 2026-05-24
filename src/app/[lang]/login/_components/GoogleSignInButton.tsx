"use client";

import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";

export function GoogleSignInButton({
  label,
  callbackPath,
}: {
  label: string;
  /** Locale path only (e.g. `/` or `/en`); resolved against the current origin on click. */
  callbackPath: string;
}) {
  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => {
        const callbackURL = new URL(callbackPath, window.location.origin).href;
        void authClient.signIn.social({
          provider: "google",
          callbackURL,
        });
      }}
    >
      {label}
    </Button>
  );
}
