"use client";

import Image from "next/image";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { i18n, languagesLabels, type Locale } from "~/language/i18n.config";
import { localeFlagsNavbar } from "~/language/languages";

function getPathLocale(pathname: string): Locale {
  const segments = pathname.split("/");
  return i18n.locales.includes(segments[1]! as Locale)
    ? (segments[1] as Locale)
    : i18n.defaultLocale;
}

function redirectedPathName(pathname: string, locale: Locale): string {
  if (!pathname) return `/${locale}`;

  const segments = pathname.split("/");
  const hasLocaleSegment = i18n.locales.includes(segments[1]! as Locale);

  if (!hasLocaleSegment) {
    segments.shift();
    segments.unshift(locale);
  } else {
    segments[1] = locale;
  }

  return segments.join("/");
}

export function LocaleSettings() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = getPathLocale(pathname);

  const localeItems = useMemo(
    () =>
      i18n.locales.map((locale) => ({
        value: locale,
        label: languagesLabels[locale],
      })),
    [],
  );

  return (
    <Select
      items={localeItems}
      value={currentLocale}
      onValueChange={(value) => {
        if (value) {
          router.push(redirectedPathName(pathname, value));
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {i18n.locales.map((locale) => {
            const label = languagesLabels[locale];
            return (
              <SelectItem key={locale} value={locale}>
                <Image
                  src={localeFlagsNavbar[locale]}
                  alt={`${label} flag`}
                  width={24}
                  height={18}
                  className="shrink-0"
                />
                <span>{label}</span>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
