// Generates the opaque icon set used by iMessage / home-screen / browsers.
//
// WHY THIS FILE EXISTS
// Apple has no meta tag for the iMessage preview's background. Since iOS 18 the
// bubble is tinted from the preview artwork; when a page has no og:image
// (famlink.care deliberately has none) Apple samples the apple-touch-icon.
// So the tile must be a solid field with the mark on top — no transparency for
// Apple to flatten against a guess of its own (transparent regions go black).
//
// IMPORTANT LIMIT
// iMessage / Facebook always draw a small square slot for the icon. We cannot
// make the logo "float" with no square like the website nav — that square is
// platform UI. We only control the pixels inside it (white field + cyan mark).
//
// TO REGENERATE
//   node scripts/make-imessage-icon.mjs
// Then bump the ?v= query on icon <link>s in index.html so scrapers refetch.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const BACKGROUND = "#FFFFFF";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_LOGO = resolve(ROOT, "public/logo3.png");
const PUBLIC = resolve(ROOT, "public");

// ~14% padding each side → logo covers ~72% of the tile (iOS mask safe).
const LOGO_RATIO = 0.72;

const OUTPUTS = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
];

const makeTile = async (size) => {
  const logoSize = Math.max(1, Math.round(size * LOGO_RATIO));
  const logo = await sharp(SOURCE_LOGO)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .flatten({ background: BACKGROUND })
    .removeAlpha()
    .png()
    .toBuffer();
};

/** Minimal ICO writer embedding PNG payloads (Vista+). */
const writeIcoFromPngs = (entries) => {
  const count = entries.length;
  const headerSize = 6 + count * 16;
  let dataOffset = headerSize;
  const totalSize =
    headerSize + entries.reduce((sum, e) => sum + e.png.length, 0);
  const ico = Buffer.alloc(totalSize);
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(count, 4);

  entries.forEach((entry, i) => {
    const o = 6 + i * 16;
    const hint = entry.size;
    ico.writeUInt8(hint >= 256 ? 0 : hint, o);
    ico.writeUInt8(hint >= 256 ? 0 : hint, o + 1);
    ico.writeUInt8(0, o + 2);
    ico.writeUInt8(0, o + 3);
    ico.writeUInt16LE(1, o + 4);
    ico.writeUInt16LE(32, o + 6);
    ico.writeUInt32LE(entry.png.length, o + 8);
    ico.writeUInt32LE(dataOffset, o + 12);
    entry.png.copy(ico, dataOffset);
    dataOffset += entry.png.length;
  });

  return ico;
};

const main = async () => {
  const results = [];

  for (const { name, size } of OUTPUTS) {
    const buf = await makeTile(size);
    writeFileSync(resolve(PUBLIC, name), buf);
    const meta = await sharp(buf).metadata();
    results.push({
      path: `public/${name}`,
      width: meta.width,
      height: meta.height,
      hasAlpha: Boolean(meta.hasAlpha),
      bytes: buf.length,
    });
  }

  const icoEntries = [];
  for (const size of [16, 32, 48]) {
    icoEntries.push({ size, png: await makeTile(size) });
  }
  const ico = writeIcoFromPngs(icoEntries);
  writeFileSync(resolve(PUBLIC, "favicon.ico"), ico);
  results.push({
    path: "public/favicon.ico",
    width: "16/32/48",
    height: "multi",
    hasAlpha: false,
    bytes: ico.length,
  });

  console.log(`Background: ${BACKGROUND} (fully opaque — required by iOS)`);
  console.log(`Logo source: public/logo3.png\n`);
  for (const r of results) {
    console.log(
      `${r.path}\n  ${r.width}×${r.height}, alpha: ${r.hasAlpha}, ${r.bytes} bytes`
    );
  }

  const { data, info } = await sharp(resolve(PUBLIC, "apple-touch-icon.png"))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const corner = [data[0], data[1], data[2]];
  console.log(
    `\nCorner RGB ${corner.join(",")} | ${info.width}×${info.height} | channels ${ch}`
  );
  if (corner[0] !== 255 || corner[1] !== 255 || corner[2] !== 255) {
    throw new Error("apple-touch-icon is not pure white at corner");
  }
};

main().catch((error) => {
  console.error("Failed to generate icons:", error.message);
  console.error("If sharp is missing, run: npm i -D sharp");
  process.exit(1);
});
