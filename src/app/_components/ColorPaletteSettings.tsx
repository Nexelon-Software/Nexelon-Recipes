"use client";

import { useMemo } from "react";

import { useColorPalette } from "~/app/_components/ColorPaletteProvider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { COLOR_PALETTES, isColorPaletteId } from "~/lib/color-palette";
import useTranslation from "~/language/useTranslation";

export function ColorPaletteSettings() {
  const { t, lang } = useTranslation();
  const { palette, setPalette, mounted } = useColorPalette();

  const labelFor = (id: (typeof COLOR_PALETTES)[number]["id"]) =>
    t(lang.palette[id]);

  const paletteItems = useMemo(
    () =>
      COLOR_PALETTES.map(({ id }) => ({
        value: id,
        label: labelFor(id),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labelFor uses t/lang palette keys
    [
      t,
      lang.palette.nexelon,
      lang.palette.ocean,
      lang.palette.forest,
      lang.palette.vscode,
    ],
  );

  const selectedPalette = mounted ? palette : null;

  return (
    <Select
      items={paletteItems}
      value={selectedPalette}
      disabled={!mounted}
      onValueChange={(value) => {
        if (value && isColorPaletteId(value)) {
          setPalette(value);
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t(lang.palette.toggle)} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {COLOR_PALETTES.map(({ id, previewHex }) => (
            <SelectItem key={id} value={id}>
              <span
                className="size-4 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: previewHex }}
                aria-hidden
              />
              <span>{labelFor(id)}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
