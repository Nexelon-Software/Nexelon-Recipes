import { env } from "~/env";
import { i18n, localeToDateFnsCode, type Locale } from "~/language/i18n.config";

/** Public path with locale prefix only for non-default locale (sk → no prefix). */
export function localePath(locale: Locale, pathname = "/"): string {
  const normalized =
    pathname === "/" ? "" : pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (locale === i18n.defaultLocale) {
    return normalized === "" ? "/" : normalized;
  }

  return `/${locale}${normalized}`;
}

/** Same-origin relative path only; rejects open redirects. */
export function safeCallbackPath(
  candidate: string | null | undefined,
  fallback: string,
): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }
  if (candidate.includes("://")) return fallback;
  return candidate;
}

export function absoluteUrl(path: string): string {
  return new URL(path, env.NEXT_PUBLIC_SERVER_URL).href;
}

/** hreflang map for metadata.alternates.languages */
export function languageAlternates(pathname = "/"): Record<string, string> {
  const result: Record<string, string> = {};
  for (const locale of i18n.locales) {
    result[localeToDateFnsCode(locale)] = localePath(locale, pathname);
  }
  return result;
}

export function openGraphLocale(locale: Locale): string {
  return locale === "sk" ? "sk_SK" : "en_US";
}

export function truncateDescription(text: string, maxLength = 160): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}
