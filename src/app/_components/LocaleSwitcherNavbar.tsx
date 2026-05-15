"use client";

import React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { i18n, languagesLabels, type Locale } from "~/language/i18n.config";
import { localeFlagsNavbar } from "~/language/languages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export default function LocaleSwitcherNavbar() {
  const router = useRouter();
  const pathName = usePathname();
  const segments = pathName.split("/");
  const localeSuffix: Locale = i18n.locales.includes(segments[1]! as Locale)
    ? (segments[1] as Locale)
    : i18n.defaultLocale;

  const redirectedPathName = (locale: Locale) => {
    if (!pathName) return `/${locale}`;

    // Check if the first segment after the initial '/' is a locale
    const hasLocaleSegment = i18n.locales.includes(segments[1]! as Locale);

    // If it's not a locale or if the segment is undefined, insert the new locale
    if (!hasLocaleSegment) {
      // Remove the first empty element resulting from the initial '/'
      segments.shift();
      // Insert the locale as the first segment
      segments.unshift(locale);
    } else {
      // Replace the existing locale segment with the new locale
      segments[1] = locale;
    }

    // Reconstruct the path
    const newPath = segments.join("/");
    return newPath;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="hover: cursor-pointer">
          <Image
            src={localeFlagsNavbar[localeSuffix]}
            alt={languagesLabels[localeSuffix]}
            className="min-h-[36px] min-w-[36px]"
            width={32}
            height={24}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {i18n.locales.map((locale) => {
            const FlagIcon = localeFlagsNavbar[locale];
            const Text = languagesLabels[locale];
            return (
              <DropdownMenuItem
                key={locale}
                textValue={Text}
                className="gap-4"
                onClick={() => router.push(redirectedPathName(locale))}
              >
                <Image
                  src={FlagIcon}
                  alt={`${Text} flag`}
                  width={32}
                  height={24}
                />
                <p className="text-base font-medium">{Text}</p>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
