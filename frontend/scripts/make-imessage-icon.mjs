// Generates public/apple-touch-icon.png — the tile iMessage draws in the
// compact link preview, and the only lever that controls that bubble's colour.
//
// WHY THIS FILE EXISTS
// Apple has no meta tag for the preview's background. Since iOS 18 the bubble
// is tinted with a colour sampled from the preview artwork instead of the old
// flat grey, and when a page has no og:image (famlink.care deliberately has
// none — see index.html) the artwork Apple samples is the apple-touch-icon.
// So the way to set the bubble colour is to ship an icon that *is* that colour,
// with the mark sitting on top of it. Hence: a solid field, logo centred, no
// transparency for Apple to flatten against a guess of its own.
//
// TO CHANGE THE PREVIEW COLOUR: edit BACKGROUND below, re-run
//   node scripts/make-imessage-icon.mjs
// and commit the regenerated PNG. Nothing else in the repo carries this colour.
//
// Run by hand, not from `npm run build`. sharp is present transitively rather
// than as a declared dependency, so a build that needed it would be resting on
// somebody else's lockfile entry; the output is committed instead and the
// script only runs on the rare occasion the colour or the mark changes.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

// ─────────────────────────────────────────────────────────────────────────────
// The iMessage preview background colour.
const BACKGROUND = "#ADC5FF";

// Whether to bake BACKGROUND into the tile behind the logo.
//
// Leave this true. The baked field is not a square drawn *around* the mark — it
// is the only thing that makes the bubble #ADC5FF, because Apple picks the
// bubble tint by sampling this artwork and there is no tag to set it directly.
// Tile and bubble end up the same colour, so the tile's edges are invisible and
// the result reads as one continuous background. That is the seamless look.
//
// Setting it false ships the bare transparent logo, which sounds like the same
// thing and is not: Apple then has no colour to sample, the bubble reverts to
// grey, and the transparency gets flattened against a colour Apple chooses.
// The switch is here because it was asked for — but it trades the colour away,
// so verify on a real device before keeping it.
const BAKE_BACKGROUND = true;
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_LOGO = resolve(ROOT, "public/logo3.png");
const OUTPUT = resolve(ROOT, "public/apple-touch-icon.png");

// 180px is the size iOS asks for and the size every scraper expects an
// apple-touch-icon to be. Going bigger is tempting for sharpness but changes
// behaviour: some non-Apple scrapers fall back to apple-touch-icon when a page
// has no og:image, and a large square there reads to them as hero artwork —
// which would put the big square card back on the platforms this site removed
// it from.
const SIZE = 180;

// The mark covers ~58% of the tile. The remaining margin is not just breathing
// room: Apple samples the tile to pick the bubble tint, so the field has to
// stay the clear majority of the pixels for the tint to come back as BACKGROUND
// rather than as a blend of the field and the logo's cyan.
//
// This was briefly 72%. It was put back because the smaller mark is the version
// signed off from the iMessage screenshot, and because every extra percent of
// cyan drags Apple's sampled tint further from BACKGROUND — which is the one
// thing that decides whether iOS draws the bubble's title in dark ink or white.
const LOGO_SIZE = Math.round(SIZE * 0.58);

const main = async () => {
  const logo = await sharp(SOURCE_LOGO)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const canvas = sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: BAKE_BACKGROUND ? BACKGROUND : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: logo, gravity: "centre" }]);

  // Flattening removes the source logo's alpha. An apple-touch-icon with
  // transparency gets composited against a colour Apple chooses, which is the
  // one decision this whole file exists to take back. flatten() alone leaves a
  // fully-opaque alpha channel in place; dropping it outright means no reader
  // has to interpret one.
  await (BAKE_BACKGROUND
    ? canvas.flatten({ background: BACKGROUND }).removeAlpha()
    : canvas
  )
    .png()
    .toFile(OUTPUT);

  const { width, height, hasAlpha } = await sharp(OUTPUT).metadata();
  console.log(`Wrote ${OUTPUT}`);
  console.log(`  ${width}×${height}, alpha: ${hasAlpha}`);
  console.log(
    BAKE_BACKGROUND
      ? `  background: ${BACKGROUND} — bubble will tint to match`
      : `  background: none — WARNING: no colour for Apple to sample, bubble will be grey`
  );
};

main().catch((error) => {
  console.error("Failed to generate apple-touch-icon.png:", error.message);
  console.error("If sharp is missing, run: npm i -D sharp");
  process.exit(1);
});
