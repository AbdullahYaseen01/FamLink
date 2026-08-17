// Generates the opaque icon set + OG banner used by iMessage / WhatsApp /
// social / home-screen / browsers.
//
// WHY THIS FILE EXISTS
// Apple has no meta tag for the iMessage preview's background. Since iOS 18 the
// bubble is tinted from the preview artwork; transparent regions go black.
// So every tile must be a solid white field with the blue mark on top.
//
// TO REGENERATE
//   node scripts/make-imessage-icon.mjs
// Then bump the ?v= query on icon / OG URLs in index.html, site.webmanifest,
// and src/seo/routeMeta.js so scrapers refetch.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const BACKGROUND = "#FFFFFF";
const WORDMARK_COLOR = "#001243"; // matches .text-primary / site header
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_LOGO = resolve(ROOT, "public/logo3.png");
const PUBLIC = resolve(ROOT, "public");

// ~12% padding each side → logo covers ~76% of the tile.
const LOGO_RATIO = 0.76;

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

/** 1200×630 white banner: blue mark + "Famlink" wordmark (header style). */
const makeOgImage = async () => {
  const W = 1200;
  const H = 630;
  const logoSize = 160;
  const logo = await sharp(SOURCE_LOGO)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Horizontal lockup: mark + gap + wordmark, centered as a group.
  const wordSvg = Buffer.from(`
    <svg width="420" height="160" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="112"
        font-family="Arial, Helvetica, sans-serif"
        font-size="96"
        font-weight="700"
        fill="${WORDMARK_COLOR}"
      >Famlink</text>
    </svg>
  `);
  const wordPng = await sharp(wordSvg).png().toBuffer();
  const wordMeta = await sharp(wordPng).metadata();
  const gap = 28;
  const groupW = logoSize + gap + (wordMeta.width || 420);
  const groupLeft = Math.round((W - groupW) / 2);
  const groupTop = Math.round((H - logoSize) / 2);

  return sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([
      { input: logo, left: groupLeft, top: groupTop },
      {
        input: wordPng,
        left: groupLeft + logoSize + gap,
        top: groupTop + Math.round((logoSize - (wordMeta.height || 160)) / 2),
      },
    ])
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

  const og = await makeOgImage();
  writeFileSync(resolve(PUBLIC, "og-image.png"), og);
  const ogMeta = await sharp(og).metadata();
  results.push({
    path: "public/og-image.png",
    width: ogMeta.width,
    height: ogMeta.height,
    hasAlpha: Boolean(ogMeta.hasAlpha),
    bytes: og.length,
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
  const corner = [data[0], data[1], data[2]];
  console.log(
    `\nCorner RGB ${corner.join(",")} | ${info.width}×${info.height} | channels ${info.channels}`
  );
  if (corner[0] !== 255 || corner[1] !== 255 || corner[2] !== 255) {
    throw new Error("apple-touch-icon is not pure white at corner");
  }

  const ogRaw = await sharp(resolve(PUBLIC, "og-image.png"))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ogCorner = [ogRaw.data[0], ogRaw.data[1], ogRaw.data[2]];
  if (ogCorner[0] !== 255 || ogCorner[1] !== 255 || ogCorner[2] !== 255) {
    throw new Error("og-image is not pure white at corner");
  }
};

main().catch((error) => {
  console.error("Failed to generate icons:", error.message);
  console.error("If sharp is missing, run: npm i -D sharp");
  process.exit(1);
});
