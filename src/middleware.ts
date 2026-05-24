import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { i18n } from "./language/i18n.config";

import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { I18nConfig } from "./language/i18n.config";

/** Google OAuth rejects redirect URIs that use a bare private IP (device_id error). */
function nipIoRedirectUrl(request: NextRequest): URL | null {
  if (process.env.NODE_ENV !== "development") return null;

  const host = request.headers.get("host");
  if (!host) return null;

  const colon = host.indexOf(":");
  const hostname = colon === -1 ? host : host.slice(0, colon);
  const port = colon === -1 ? "" : host.slice(colon + 1);
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".nip.io")
  ) {
    return null;
  }

  const octets = hostname.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((n) => Number.isNaN(n) || n < 0 || n > 255)
  ) {
    return null;
  }

  const a = octets[0]!;
  const b = octets[1]!;
  const isPrivate =
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
  if (!isPrivate) return null;

  const nipHost = port ? `${hostname}.nip.io:${port}` : `${hostname}.nip.io`;
  const url = request.nextUrl.clone();
  url.host = nipHost;
  return url;
}

function getLocale(request: NextRequest, i18nConfig: I18nConfig): string {
  const { locales, defaultLocale } = i18nConfig;

  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const mutableLocales = [...locales];
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    mutableLocales,
  );

  return matchLocale(languages, locales, defaultLocale);
}

export function middleware(request: NextRequest) {
  const nipRedirect = nipIoRedirectUrl(request);
  if (nipRedirect) {
    return NextResponse.redirect(nipRedirect, 307);
  }

  let response;
  let nextLocale;

  const { locales, defaultLocale } = i18n;

  const { basePath, pathname } = request.nextUrl;

  const pathLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathLocale) {
    const isDefaultLocale = pathLocale === defaultLocale;
    if (isDefaultLocale) {
      let pathWithoutLocale =
        pathname.slice(`/${pathLocale}`.length).length === 0
          ? "/"
          : pathname.slice(`/${pathLocale}`.length);

      if (request.nextUrl.search) pathWithoutLocale += request.nextUrl.search;

      const url = basePath + pathWithoutLocale;

      response = NextResponse.redirect(new URL(url, request.url));
    }

    nextLocale = pathLocale;
  } else {
    const isFirstVisit = !request.cookies.has("NEXT_LOCALE");

    const locale = isFirstVisit ? getLocale(request, i18n) : defaultLocale;

    let newPath = `/${locale}${pathname}`;
    if (request.nextUrl.search) newPath += request.nextUrl.search;

    const url = basePath + newPath;

    response =
      locale === defaultLocale
        ? NextResponse.rewrite(new URL(url, request.url))
        : NextResponse.redirect(new URL(url, request.url));
    nextLocale = locale;
  }

  response = response ?? NextResponse.next();

  if (nextLocale) response.cookies.set("NEXT_LOCALE", nextLocale);

  return response;
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.txt|.*\\.json|.*\\.webmanifest|.*\\.xml|.*\\.ttf|.*\\.ico|.*\\.svg).*)",
  ],
};
