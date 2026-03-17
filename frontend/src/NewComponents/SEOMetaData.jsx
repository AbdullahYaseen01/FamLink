import { Helmet } from "react-helmet";

function SEOMetaData({ title, description, noIndex = false, canonical }) {
  return (
    <Helmet>
      {/* Title */}
      <title>{title}</title>

      {/* Meta Description */}
      <meta name="description" content={description} />

      {/* Robots control */}
      {noIndex && <meta name="robots" content="noindex, follow" />}

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}

export default SEOMetaData;