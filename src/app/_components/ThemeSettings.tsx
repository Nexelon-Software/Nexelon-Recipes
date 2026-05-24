"use client";

import { useEffect, useMemo, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import useTranslation from "~/language/useTranslation";

const THEME_OPTIONS = [
  { value: "light" as const, icon: Sun },
  { value: "dark" as const, icon: Moon },
  { value: "system" as const, icon: Monitor },
] as const;

type ThemeValue = (typeof THEME_OPTIONS)[number]["value"];

export function ThemeSettings() {
  const { t, lang } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const labelFor = (value: ThemeValue) => {
    if (value === "light") return t(lang.theme.light);
    if (value === "dark") return t(lang.theme.dark);
    return t(lang.theme.system);
  };

  const themeItems = useMemo(
    () =>
      THEME_OPTIONS.map(({ value }) => ({
        value,
        label: labelFor(value),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labelFor uses t/lang theme keys
    [t, lang.theme.light, lang.theme.dark, lang.theme.system],
  );

  const selectedTheme =
    mounted && theme && THEME_OPTIONS.some((o) => o.value === theme)
      ? theme
      : null;

  return (
    <Select
      items={themeItems}
      value={selectedTheme}
      disabled={!mounted}
      onValueChange={(value) => {
        if (value) {
          setTheme(value);
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t(lang.theme.toggle)} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {THEME_OPTIONS.map(({ value, icon: Icon }) => (
            <SelectItem key={value} value={value}>
              <Icon className="size-4 shrink-0" />
              <span>{labelFor(value)}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
