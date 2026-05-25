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

export function ProfileSettings() {
  const { t, lang } = useTranslation();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t(lang.auth.profile.language)}</CardTitle>
        </CardHeader>
        <CardContent>
          <LocaleSettings />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t(lang.auth.profile.theme)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
    </div>
  );
}
