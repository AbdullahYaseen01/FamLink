import { Helmet } from "react-helmet";

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
function SEOMetaData({
  title,
  description,
  noIndex = false,
  canonical,
  image = "https://famlink.care/social-preview-v2.png",
  type = "website",
}) {
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
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}

export default SEOMetaData;
