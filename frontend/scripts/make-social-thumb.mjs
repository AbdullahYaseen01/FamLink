// Generates public/logo-social.png — the small square thumbnail used for link
// previews.
//
// ────────────────────────────────────────────────────────────────────────────
// WHY A SQUARE THUMBNAIL AND NOT THE 1200×630 BANNER
//
// A link preview's size is decided by two things: the aspect of og:image and
// the value of twitter:card. A 1200×630 image plus `summary_large_image` tells
// every platform to render the full-bleed banner card. A ~200×200 image plus
// `summary` gets the compact card with a thumbnail beside the text.
//
// The light blue field is doing real work, not decoration: iMessage samples the
// dominant colour of the thumbnail and tints the message bubble to match. A
// transparent or white logo would give a white bubble; #AEC4FF gives a Famlink
// blue one, the same way LinkedIn's navy thumbnail produces a navy bubble.
//
// Built from public/logo3.png rather than redrawn, so the mark keeps its actual
// ink colour (#38AEE3) instead of drifting from whatever a spec sheet says.
//
// Run: node scripts/make-social-thumb.mjs
// ────────────────────────────────────────────────────────────────────────────

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SIZE = 200;        // the whole canvas
const LOGO = 150;        // the mark, ~75% of it
const BACKGROUND = { r: 0xae, g: 0xc4, b: 0xff, alpha: 1 }; // #AEC4FF

const SOURCE = resolve(ROOT, "public/logo3.png");
const OUTPUT = resolve(ROOT, "public/logo-social.png");

const run = async () => {
  // `contain` rather than `cover`: the source is square today, but cropping a
  // logo is never the right failure mode if that changes.
  const mark = await sharp(SOURCE)
    .resize(LOGO, LOGO, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const offset = Math.round((SIZE - LOGO) / 2);

  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: mark, top: offset, left: offset }])
    // Flattened AND stripped of its alpha channel. Every pixel is opaque
    // either way, but some scrapers read the channel rather than the pixels and
    // composite a transparent-capable image onto white — which would lose the
    // bubble tint that is the entire point of the coloured field.
    .flatten({ background: BACKGROUND })
    .removeAlpha()
    .png()
    .toFile(OUTPUT);

  const meta = await sharp(OUTPUT).metadata();
  console.log(
    `wrote public/logo-social.png — ${meta.width}×${meta.height}, ` +
      `${meta.hasAlpha ? "alpha" : "opaque"}`
  );
};

run().catch((error) => {
  console.error("Could not build the social thumbnail:", error);
  process.exit(1);
});
