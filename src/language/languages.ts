import type { Locale } from "./i18n.config";
import type en from "./lang/en.json";
import type { langMaps } from "./langMaps";

export type LangType = typeof en;

const dictionaries = {
  sk: () => import("./lang/sk.json").then((module) => module.default),
  en: () => import("./lang/en.json").then((module) => module.default),
};

export const availableLanguages: Locale[] = Object.keys(
  dictionaries,
) as Locale[];

export const localeFlagsNavbar = {
  en: "https://purecatamphetamine.github.io/country-flag-icons/3x2/US.svg",
  sk: "https://purecatamphetamine.github.io/country-flag-icons/3x2/SK.svg",
};

export const getLanguage = async (locale: Locale): Promise<LangType> => {
  const loader = dictionaries[locale];
  if (typeof loader === "function") {
    return loader();
  } else {
    return dictionaries.en();
  }
};

export function flattenTranslations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, any>,
  prefix = "",
): Record<string, string> {
  if (obj === null || obj === undefined) {
    return {};
  }

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

type LangKeys<T> = T extends string
  ? T
  : { [K in keyof T]: LangKeys<T[K]> }[keyof T];

type TranslationKey = LangKeys<typeof langMaps>;

export const ts = (langObj: LangType, key: TranslationKey) => {
  const translationData = flattenTranslations(langObj);
  const keyString = typeof key === "string" ? key : String(key);
  const translation = translationData?.[keyString];
  if (translation) return translation;
  if (key === undefined) {
    console.warn(
      "Missing some entry in langMaps.ts, please regenerate it with npm run generate:lang",
      key,
    );

    return "❌ Missing entry for some key, please regenerate langMaps.ts ❌";
  }

  console.warn("Missing translation for key", keyString);

  // fallback: last part of the key
  const parts = keyString.split(".");
  return `❌ Missing translation for: ${parts[parts.length - 1]} ❌`;
};
