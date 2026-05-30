import { redirect } from "next/navigation";

import type { Locale } from "~/language/i18n.config";

import { RecipesAppShell } from "../myrecipes/_components/RecipesAppShell";
import { getRecipesPageContext } from "../myrecipes/_lib/page-data";
import { PeoplePageContent } from "./_components/PeoplePageContent";

export default async function PeoplePage({
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

  return (
    <RecipesAppShell lang={lang} imageUrl={imageUrl}>
      <PeoplePageContent />
    </RecipesAppShell>
  );
}
