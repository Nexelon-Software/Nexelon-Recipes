"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";

import { translations } from "./lang";
import { i18n, type Locale } from "./i18n.config";
import { langMaps } from "./langMaps";

type LangKeys<T> = T extends string
  ? T
  : { [K in keyof T]: LangKeys<T[K]> }[keyof T];

export type TranslationKey = LangKeys<typeof langMaps>;

type TranslationContextType = {
  locale: Locale;
  lang: typeof langMaps;
  t: (text: TranslationKey) => string;
};

const TranslationContext = createContext<TranslationContextType>({
  locale: i18n.defaultLocale,
  lang: langMaps,
  t: (text: TranslationKey) => text ?? "XXXXXXXXXXXXXXXXXXX",
});

export function useLocale(): Locale {
  const pathname = usePathname();
  const pathnameItems = pathname.split("/");
  const lang: Locale =
    pathnameItems[1]?.length === 2
      ? (pathnameItems[1] as Locale)
      : i18n.defaultLocale;

  return lang;
}

export default function useTranslation(): TranslationContextType {
  //useDebugValue(`useTranslation`);
  return useContext(TranslationContext);
}

type TranslationProviderProps = {
  children: React.ReactNode;
};

function flattenTranslations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, any>,
  prefix = "",
): Record<string, string> {
  return Object.entries(obj).reduce(
    (acc, [k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "object" && v !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Object.assign(acc, flattenTranslations(v, key));
      } else {
        acc[key] = v as string;
      }
      return acc;
    },
    {} as Record<string, string>,
  );
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const lang = useLocale();

  const translationData = useMemo(
    () => flattenTranslations(translations[lang]),
    [lang],
  );

  const t = (key: TranslationKey) => {
    const translation = translationData?.[key];
    if (translation) return translation;

    if (key === undefined) {
      console.warn(
        "Missing some entry in langMaps.ts, please regenerate it with npm run generate:lang",
        key,
      );

      return "❌ Missing entry for some key, please regenerate langMaps.ts ❌";
    }

    console.warn("Missing translation for key", key);

    // fallback: last part of the key
    const parts = key.split(".");
    return `❌ Missing translation for: ${parts[parts.length - 1]} ❌`;
  };

  return (
    <TranslationContext.Provider value={{ lang: langMaps, t, locale: lang }}>
      {children}
    </TranslationContext.Provider>
  );
}
