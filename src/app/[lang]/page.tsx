import { redirect } from "next/navigation";

import { localePath } from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;

  redirect(localePath(lang, "/myrecipes"));
}
