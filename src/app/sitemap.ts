import type { MetadataRoute } from "next";

import { env } from "~/env";
import { i18n, type Locale } from "~/language/i18n.config";
import { localePath } from "~/lib/seo-url";

const baseUrl = env.NEXT_PUBLIC_SERVER_URL;

function sitemapEntry(
  locale: Locale,
  pathname: string,
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${baseUrl}${localePath(locale, pathname)}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of i18n.locales) {
    entries.push(sitemapEntry(locale, "/", 1));
  }

  return entries;
}
