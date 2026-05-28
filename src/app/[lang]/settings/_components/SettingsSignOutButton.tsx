"use client";

import { Button } from "~/components/ui/button";
import useTranslation from "~/language/useTranslation";
import { authClient } from "~/server/better-auth/client";

export function SettingsSignOutButton({ loginPath }: { loginPath: string }) {
  const { t, lang } = useTranslation();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        void authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = loginPath;
            },
          },
        });
      }}
    >
      {t(lang.auth.settings.signOut)}
    </Button>
  );
}
