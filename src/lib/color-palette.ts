export const COLOR_PALETTE_STORAGE_KEY = "nexelon-recipes-color-palette";

export const DEFAULT_COLOR_PALETTE = "nexelon" as const;

export const COLOR_PALETTES = [
  { id: "nexelon", previewHex: "#ff2d3f" },
  { id: "ocean", previewHex: "#0ea5e9" },
  { id: "forest", previewHex: "#22c55e" },
  { id: "vscode", previewHex: "#007acc" },
] as const;

export type ColorPaletteId = (typeof COLOR_PALETTES)[number]["id"];

const paletteIds = new Set<string>(COLOR_PALETTES.map((p) => p.id));

export function isColorPaletteId(value: string): value is ColorPaletteId {
  return paletteIds.has(value);
}

export function applyColorPalette(id: ColorPaletteId): void {
  document.documentElement.setAttribute("data-palette", id);
}

export function readStoredColorPalette(): ColorPaletteId | null {
  try {
    const stored = localStorage.getItem(COLOR_PALETTE_STORAGE_KEY);
    if (stored && isColorPaletteId(stored)) {
      return stored;
    }
  } catch {
    // private mode / blocked storage
  }
  return null;
}

export function writeStoredColorPalette(id: ColorPaletteId): void {
  try {
    localStorage.setItem(COLOR_PALETTE_STORAGE_KEY, id);
  } catch {
    // private mode / blocked storage
  }
}

const paletteIdList = COLOR_PALETTES.map((p) => p.id);

export const colorPaletteInitScript = `(function(){try{var k=${JSON.stringify(COLOR_PALETTE_STORAGE_KEY)};var d=${JSON.stringify(DEFAULT_COLOR_PALETTE)};var ids=${JSON.stringify(paletteIdList)};var v=localStorage.getItem(k);var p=v&&ids.indexOf(v)!==-1?v:d;document.documentElement.setAttribute("data-palette",p)}catch(e){document.documentElement.setAttribute("data-palette",${JSON.stringify(DEFAULT_COLOR_PALETTE)})}})();`;
