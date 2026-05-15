import { z } from "zod";

export const i18n = {
  defaultLocale: "sk",
  locales: ["en", "sk"],
} as const;

//generate object with language labels for eac language
export const languagesLabels = {
  en: "English",
  sk: "Slovenčina",
};

export const dateFnsCodes = {
  en: "en",
  sk: "sk",
};

export function localeToDateFnsCode(locale: Locale) {
  switch (locale) {
    case "en":
      return "en-US";
    case "sk":
      return "sk-SK";
    default:
      return "en-US";
  }
}

export const LocaleSchema = z.enum(i18n.locales);

export type Locale = z.infer<typeof LocaleSchema>;
export type I18nConfig = typeof i18n;
