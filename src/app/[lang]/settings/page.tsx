import { redirect } from "next/navigation";

import type { Locale } from "~/language/i18n.config";
import { getLanguage, ts } from "~/language/languages";
import { langMaps } from "~/language/langMaps";
import { RecipesAppShell } from "~/app/[lang]/recipes/_components/RecipesAppShell";
import { getRecipesPageContext } from "~/app/[lang]/recipes/_lib/page-data";

import { SettingsPersonalizationSection } from "./_components/SettingsPersonalizationSection";
import { SettingsProfileSection } from "./_components/SettingsProfileSection";
import { SettingsSignOutButton } from "./_components/SettingsSignOutButton";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const { session, loginPath, imageUrl, userId } =
    await getRecipesPageContext(lang);

  if (!session?.user) {
    redirect(loginPath);
  }

  const langObj = await getLanguage(lang);
  const user = session.user;

  return (
    <RecipesAppShell lang={lang} imageUrl={imageUrl} userId={userId}>
      <div className="container mx-auto max-w-lg space-y-6 px-3 py-6 sm:px-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {ts(langObj, langMaps.auth.settings.title)}
        </h1>
        <SettingsProfileSection
          name={user.name}
          email={user.email}
          imageUrl={imageUrl}
        />
        <SettingsPersonalizationSection />
        <SettingsSignOutButton loginPath={loginPath} />
      </div>
    </RecipesAppShell>
  );
}
