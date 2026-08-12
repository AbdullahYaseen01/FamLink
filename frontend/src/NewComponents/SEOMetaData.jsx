import { Helmet } from "react-helmet";
import { serializeJsonLd } from "../seo/jsonLd";
import { DEFAULT_OG_IMAGE, isSquareShareImage } from "../seo/routeMeta";

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
//   image       — absolute preview image URL. Defaults to the white OG banner
//                 (DEFAULT_OG_IMAGE / og-image.png). Pass a custom 1200×630 for
//                 article cards, or null to force text-only.
//   type        — Open Graph type; "website" for pages, "article" for blog posts
//   jsonLd      — array of schema.org node objects (built in src/seo/jsonLd.js)

function SEOMetaData({
  title,
  description,
  noIndex = false,
  canonical,
  image,
  type = "website",
  jsonLd,
  ogTitle,
  ogDescription,
}) {
  const resolvedImage = image === undefined ? DEFAULT_OG_IMAGE : image;
  const square = isSquareShareImage(resolvedImage);
  const twitterCard = !resolvedImage
    ? "summary"
    : square
      ? "summary"
      : "summary_large_image";
  const socialTitle = ogTitle || title;
  const socialDescription = ogDescription || description;
  const url =
    canonical || (typeof window !== "undefined" ? window.location.href : undefined);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta
        name="robots"
        content={noIndex ? "noindex, follow" : "index, follow"}
      />

      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:site_name" content="FamLink" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={socialTitle} />
      {socialDescription && (
        <meta property="og:description" content={socialDescription} />
      )}
      {url && <meta property="og:url" content={url} />}
      {resolvedImage && <meta property="og:image" content={resolvedImage} />}
      {resolvedImage && (
        <>
          <meta property="og:image:width" content={square ? "512" : "1200"} />
          <meta property="og:image:height" content={square ? "512" : "630"} />
        </>
      )}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={socialTitle} />
      {socialDescription && (
        <meta name="twitter:description" content={socialDescription} />
      )}
      {resolvedImage && <meta name="twitter:image" content={resolvedImage} />}

      {(jsonLd || []).map((node, i) => (
        <script key={i} type="application/ld+json">
          {serializeJsonLd(node)}
        </script>
      ))}
    </Helmet>
  );
}

export default SEOMetaData;
