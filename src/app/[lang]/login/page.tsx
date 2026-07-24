import { redirect } from "next/navigation";

import { localePath, safeCallbackPath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";
import { getSession } from "~/server/better-auth/server";

import { GoogleSignInButton } from "./_components/GoogleSignInButton";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ callback?: string }>;
}) {
  const { lang: langParam } = await params;
  const { callback: callbackParam } = await searchParams;
  const lang = langParam as Locale;
  const session = await getSession();
  const homePath = localePath(lang, "/");
  const callbackPath = safeCallbackPath(callbackParam, homePath);

  if (session?.user) {
    redirect(callbackPath);
  }

  const langObj = await getLanguage(lang);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <div className="border-border bg-card w-full max-w-sm space-y-6 rounded-lg border p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {ts(langObj, langMaps.auth.login.title)}
          </h1>
          <p className="text-muted-foreground text-sm">
            {ts(langObj, langMaps.auth.login.subtitle)}
          </p>
        </div>

        <GoogleSignInButton
          label={ts(langObj, langMaps.auth.login.google)}
          callbackPath={callbackPath}
        />
      </div>
    </div>
  );
}
