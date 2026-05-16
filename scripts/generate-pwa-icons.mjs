import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const iconsDir = path.join(publicDir, "icons");

const THEME_BG = "#ffffff";
const OG_BG = "#fafafa";
const OG_TEXT = "#171717";
const ACCENT = "#ea580c";

function iconSvg(size) {
  return Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="${THEME_BG}"/>
      <circle cx="${size / 2}" cy="${size * 0.36}" r="${size * 0.18}" fill="${ACCENT}"/>
      <path d="M${size * 0.22} ${size * 0.52} Q${size * 0.22} ${size * 0.34} ${size * 0.5} ${size * 0.34} Q${size * 0.78} ${size * 0.34} ${size * 0.78} ${size * 0.52} L${size * 0.78} ${size * 0.58} Q${size * 0.78} ${size * 0.66} ${size * 0.7} ${size * 0.66} L${size * 0.3} ${size * 0.66} Q${size * 0.22} ${size * 0.66} ${size * 0.22} ${size * 0.58} Z" fill="${ACCENT}"/>
      <rect x="${size * 0.28}" y="${size * 0.68}" width="${size * 0.44}" height="${size * 0.2}" rx="${size * 0.04}" fill="#171717"/>
    </svg>
  `);
}

async function ensureDirs() {
  await fs.mkdir(iconsDir, { recursive: true });
}

async function writePng(svg, size, outPath) {
  await sharp(svg).resize(size, size).png().toFile(outPath);
}

async function generateIcons() {
  await writePng(iconSvg(512), 192, path.join(iconsDir, "icon-192.png"));
  await writePng(iconSvg(512), 512, path.join(iconsDir, "icon-512.png"));
  await writePng(iconSvg(512), 180, path.join(publicDir, "apple-touch-icon.png"));
  console.log("Generated PWA icons in public/icons/ and apple-touch-icon.png");
}

async function generateOgImage() {
  const iconSize = 280;
  const icon = await sharp(iconSvg(512)).resize(iconSize, iconSize).png().toBuffer();

  const titleSvg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="${OG_BG}"/>
      <text x="600" y="420" text-anchor="middle" font-family="system-ui, sans-serif" font-size="56" font-weight="600" fill="${OG_TEXT}">Nexelon recepty</text>
      <text x="600" y="490" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" fill="#737373">Zbierka receptov Nexelon</text>
    </svg>
  `;

  const iconLeft = Math.floor((1200 - iconSize) / 2);
  const iconTop = 48;

  await sharp(Buffer.from(titleSvg))
    .composite([{ input: icon, left: iconLeft, top: iconTop }])
    .png()
    .toFile(path.join(publicDir, "og.png"));

  console.log("Generated public/og.png");
}

await ensureDirs();
await generateIcons();
await generateOgImage();
