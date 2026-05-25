"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyColorPalette,
  DEFAULT_COLOR_PALETTE,
  readStoredColorPalette,
  writeStoredColorPalette,
  type ColorPaletteId,
} from "~/lib/color-palette";

type ColorPaletteContextValue = {
  palette: ColorPaletteId;
  setPalette: (id: ColorPaletteId) => void;
  mounted: boolean;
};

const ColorPaletteContext = createContext<ColorPaletteContextValue | null>(
  null,
);

export function ColorPaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<ColorPaletteId>(
    DEFAULT_COLOR_PALETTE,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredColorPalette();
    const initial = stored ?? DEFAULT_COLOR_PALETTE;
    setPaletteState(initial);
    applyColorPalette(initial);
    setMounted(true);
  }, []);

  const setPalette = useCallback((id: ColorPaletteId) => {
    setPaletteState(id);
    applyColorPalette(id);
    writeStoredColorPalette(id);
  }, []);

  const value = useMemo(
    () => ({ palette, setPalette, mounted }),
    [palette, setPalette, mounted],
  );

  return (
    <ColorPaletteContext.Provider value={value}>
      {children}
    </ColorPaletteContext.Provider>
  );
}

export function useColorPalette(): ColorPaletteContextValue {
  const context = useContext(ColorPaletteContext);
  if (!context) {
    throw new Error("useColorPalette must be used within ColorPaletteProvider");
  }
  return context;
}
