"use client";

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
        <CardContent>
          <ThemeSettings />
        </CardContent>
      </Card>
    </div>
  );
}
