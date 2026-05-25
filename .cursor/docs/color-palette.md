# Nexelon color palette

Canonical brand colors for UI in this repo. Map these to semantic CSS variables in
[`src/styles/globals.css`](../../src/styles/globals.css); use Tailwind semantic classes
in components (`bg-background`, `text-primary`, etc.), not raw hex.

## Tokens

| Name | Hex | Role |
|------|-----|------|
| Void Black | `#02040A` | Primary background |
| Midnight Surface | `#0A0F1A` | Secondary background |
| Slate Surface | `#111827` | Cards / elevated surfaces |
| Nexelon Red | `#FF2D3F` | Primary brand / CTA |
| Inferno Red | `#D91F32` | Button hover / active |
| Ember Orange | `#F97316` | Food accent / highlights |
| Golden Spice | `#F59E0B` | Trending / premium accent |
| Fresh Herb | `#10B981` | Success / healthy content |
| Frost White | `#F9FAFB` | Primary text |
| Smoke Gray | `#A1A1AA` | Secondary text |
| Shadow Gray | `#71717A` | Disabled / muted UI |

## Semantic mapping

| Usage | Token |
|-------|--------|
| Page background | Void Black → `--background` |
| Secondary surfaces | Midnight → `--secondary` |
| Cards, popovers | Slate → `--card`, `--popover` |
| CTA, links (brand) | Nexelon Red → `--primary` |
| Primary button hover | Inferno Red → `--primary-hover` |
| Primary text on brand | Frost White → `--primary-foreground` |
| Body text | Frost White → `--foreground` |
| Secondary text | Smoke Gray → `--muted-foreground` |
| Disabled / muted UI | Shadow Gray → `--muted` |
| Success states | Fresh Herb → `--success` (named token) |
| Food highlights | Ember Orange → `--color-ember` |
| Premium / trending | Golden Spice → `--color-golden-spice` |

## Rules for implementers

- Prefer `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `hover:bg-primary-hover` (once mapped).
- Use `text-ember`, `text-golden-spice`, or chart/accent tokens for recipe highlights—not one-off hex in JSX.
- CTAs use the `Button` default variant (`primary` = Nexelon Red).

## Color palettes (user-selectable)

Users can switch palettes in Profile → Appearance. Choice is stored in `localStorage` (`nexelon-recipes-color-palette`) and applied via `data-palette` on `<html>`.

| Id | Description |
|----|-------------|
| `nexelon` | Default — tokens in this doc |
| `ocean` | Cool blue/teal on slate backgrounds |
| `forest` | Green primary on green-tinted surfaces |
| `vscode` | Visual Studio Code Dark+ — `#1e1e1e` editor, `#007acc` accent, syntax-style accents |

CSS overrides live in [`src/styles/globals.css`](../../src/styles/globals.css):

- **Light:** `:root:not(.dark)[data-palette="…"]`
- **Dark:** `.dark[data-palette="…"]`

Registry and init script: [`src/lib/color-palette.ts`](../../src/lib/color-palette.ts). The same `data-palette` id applies in both color modes.
