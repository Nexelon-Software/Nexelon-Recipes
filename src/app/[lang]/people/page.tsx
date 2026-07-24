import { redirect } from "next/navigation";

import type { Locale } from "~/language/i18n.config";

import { RecipesAppShell } from "../recipes/_components/RecipesAppShell";
import { getRecipesPageContext } from "../recipes/_lib/page-data";
import { PeoplePageContent } from "./_components/PeoplePageContent";

export default async function PeoplePage({
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

  return (
    <RecipesAppShell lang={lang} imageUrl={imageUrl} userId={userId}>
      <PeoplePageContent />
    </RecipesAppShell>
  );
}
