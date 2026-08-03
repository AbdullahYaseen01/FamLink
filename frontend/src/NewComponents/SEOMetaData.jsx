import { Helmet } from "react-helmet";
import { serializeJsonLd } from "../seo/jsonLd";

// Central SEO tag block for every public page. Beyond title/description it emits
// Open Graph + Twitter Card tags (what Google, Facebook, iMessage, Slack, etc.
// read for rich previews) and an explicit robots directive, so any page that
// renders this component is both indexable and shareable without extra work.
//
// Props:
//   title       — page <title> and og/twitter title
//   description — meta description + og/twitter description
//   noIndex     — set true on pages that shouldn't be indexed (auth, thank-you)
//   canonical   — absolute canonical URL (also used as og:url when set)
//   image       — absolute preview image URL (defaults to the FamLink logo)
//   type        — Open Graph type; "website" for pages, "article" for blog posts
//   jsonLd      — array of schema.org node objects (built in src/seo/jsonLd.js);
//                 values must match what the prerender script bakes into the
//                 static head, so build them via src/seo/routeMeta.js
// The site-wide thumbnail. Square on purpose — see DEFAULT_OG_IMAGE in
// src/seo/routeMeta.js and the note in index.html. Kept byte-identical to the
// prerender script's default so a page's static head and its client-rendered
// head cannot disagree about what a share preview looks like.
const DEFAULT_OG_IMAGE = "https://famlink.care/logo-social.png";

function SEOMetaData({
  title,
  description,
  noIndex = false,
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  jsonLd,
  // Social copy, when the share card wants different wording from the search
  // result. Falls back to title/description so only the routes that care set
  // them — and named the same as the prerender script's fields, so a route
  // object spread into this component produces the identical head.
  ogTitle,
  ogDescription,
}) {
  // The card type has to follow the image: a square thumbnail with
  // `summary_large_image` gets letterboxed into a banner, which is the exact
  // giant-card behaviour the square image exists to avoid. Pages that pass
  // their own image (resource articles, with a real 1200×630 photo) keep the
  // large card.
  const twitterCard = image === DEFAULT_OG_IMAGE ? "summary" : "summary_large_image";
  const socialTitle = ogTitle || title;
  const socialDescription = ogDescription || description;
  // Prefer the canonical URL for og:url; fall back to the live URL client-side.
  const url =
    canonical || (typeof window !== "undefined" ? window.location.href : undefined);

  return (
    <Helmet>
      {/* Title + description */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Robots — explicit index/follow unless the page opts out */}
      <meta
        name="robots"
        content={noIndex ? "noindex, follow" : "index, follow"}
      />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph (Facebook, LinkedIn, iMessage, Slack, …) */}
      <meta property="og:site_name" content="FamLink" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={socialTitle} />
      {socialDescription && <meta property="og:description" content={socialDescription} />}
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}
      {/* Declared so a scraper can size the card before it fetches the file. */}
      {image === DEFAULT_OG_IMAGE && (
        <meta property="og:image:width" content="200" />
      )}
      {image === DEFAULT_OG_IMAGE && (
        <meta property="og:image:height" content="200" />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={socialTitle} />
      {socialDescription && <meta name="twitter:description" content={socialDescription} />}
      {image && <meta name="twitter:image" content={image} />}

      {/* Structured data */}
      {(jsonLd || []).map((node, i) => (
        <script key={i} type="application/ld+json">
          {serializeJsonLd(node)}
        </script>
      ))}
    </Helmet>
  );
}

export default SEOMetaData;
