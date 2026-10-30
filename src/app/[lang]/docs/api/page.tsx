import type { Locale } from "~/language/i18n.config";
import { RecipesAppShell } from "~/app/[lang]/recipes/_components/RecipesAppShell";
import { getRecipesPageContext } from "~/app/[lang]/recipes/_lib/page-data";

import { ApiDocsContent } from "./_components/ApiDocsContent";

export default async function ApiDocsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const { session, loginPath, imageUrl, userId } =
    await getRecipesPageContext(lang);

  return (
    <RecipesAppShell
      lang={lang}
      imageUrl={imageUrl}
      loginPath={session?.user ? undefined : loginPath}
      userId={userId}
    >
      <ApiDocsContent />
    </RecipesAppShell>
  );
}
