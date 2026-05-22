"use client";

import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";

export function GoogleSignInButton({
  label,
  callbackURL,
}: {
  label: string;
  callbackURL: string;
}) {
  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => {
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
