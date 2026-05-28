"use client";

import { ColorPaletteSettings } from "~/app/_components/ColorPaletteSettings";
import { LocaleSettings } from "~/app/_components/LocaleSettings";
import { ThemeSettings } from "~/app/_components/ThemeSettings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import useTranslation from "~/language/useTranslation";

export function SettingsPersonalizationSection() {
  const { t, lang } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(lang.auth.settings.sections.personalization)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t(lang.auth.settings.language)}
          </p>
          <LocaleSettings />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t(lang.theme.mode)}
          </p>
          <ThemeSettings />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t(lang.palette.label)}
          </p>
          <ColorPaletteSettings />
        </div>
      </CardContent>
    </Card>
  );
}
