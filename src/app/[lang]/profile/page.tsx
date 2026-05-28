import { redirect } from "next/navigation";

import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";
import { RecipesAppShell } from "~/app/[lang]/myrecipes/_components/RecipesAppShell";
import { getRecipesPageContext } from "~/app/[lang]/myrecipes/_lib/page-data";

import { ProfileAccountCard } from "./_components/ProfileAccountCard";
import { ProfileSettings } from "./_components/ProfileSettings";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const { session, loginPath, imageUrl } = await getRecipesPageContext(lang);

  if (!session?.user) {
    redirect(loginPath);
  }

  const langObj = await getLanguage(lang);
  const user = session.user;

  return (
    <RecipesAppShell lang={lang} loginPath={loginPath} imageUrl={imageUrl}>
      <div className="container mx-auto max-w-lg space-y-6 px-3 py-6 sm:px-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {ts(langObj, langMaps.auth.profile.title)}
        </h1>
        <ProfileAccountCard
          name={user.name}
          email={user.email}
          imageUrl={imageUrl}
        />
        <ProfileSettings />
      </div>
    </RecipesAppShell>
  );
}
