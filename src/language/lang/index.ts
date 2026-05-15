import en from "./en.json";
import sk from "./sk.json";

export const translations = { en, sk } as const;
export type Translation = typeof translations.en;
export type Translations = typeof translations;

export function format<T extends Record<string, string | number>>(
  template: string,
  vars: T,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key)
      ? String(vars[key as keyof T])
      : `{${key}}`,
  );
}
