import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { articlesData } from "../../data/articlesData";
import { api } from "../../Config/api";
import SEOMetaData from "../SEOMetaData";
import { resourcesIndexMeta } from "../../seo/routeMeta";
import CommunityResourceCard from "../CommunityResourceCard";
import { ArrowLeft } from "lucide-react";

// Read-time estimate for database articles, which don't store one.
const readMinutes = (html) => {
  const words = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const ResourcesPage = () => {
  const navigate = useNavigate();

  // Everything published through the admin console. This page used to render
  // only the three hardcoded articles, so nothing written in the CMS ever
  // reached the resources directory — a blog could be published and still be
  // invisible unless you had its direct URL.
  const [published, setPublished] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The endpoint returns published articles only; drafts are admin-side.
        const { data } = await api.get("/blogs", { params: { limit: 100 } });
        if (!cancelled) setPublished(Array.isArray(data?.data) ? data.data : []);
      } catch {
        // A failed fetch leaves the static fallback below in place rather than
        // emptying the page.
        if (!cancelled) setPublished([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Database articles win; the hardcoded three fill in only while they haven't
  // been seeded yet. Matching on slug is what stops a seeded article appearing
  // twice — once from the API and once from the local copy of itself.
  const articles = useMemo(() => {
    const fromDb = published.map((blog) => ({
      key: blog._id,
      // Published before slugs existed? Fall back to the id, which is what the
      // article route resolves for those.
      slug: blog.slug || blog._id,
      title: blog.title,
      excerpt: blog.excerpt,
      time: readMinutes(blog.content),
      img: blog.featuredImage || null,
    }));

    const seeded = new Set(fromDb.map((a) => a.slug));
    const fallback = articlesData
      .filter((a) => !seeded.has(a.slug))
      .map((a) => ({
        key: `static-${a.id}`,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        time: a.time,
        img: a.img,
      }));

    return [...fromDb, ...fallback];
  }, [published]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#f9fafb] min-h-screen">
      {/* SEO for the Resources directory page */}
      <SEOMetaData {...resourcesIndexMeta()} />

      {/* Stylish Hero Header */}
      <div className="relative overflow-hidden bg-[#001243] border-b border-gray-100 py-2 px-4">
        {/* Top Navigation Bar for returning to homepage */}
        <div className="container mx-auto max-w-6xl flex items-center pt-2 pb-4 relative z-20">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-white hover:text-[#AEC4FF] transition-colors bg-transparent border-none cursor-pointer Livvic-Medium text-[15px]"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to FamLink
          </button>
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10 pb-8">
          <h1 className="Livvic-Bold text-white text-4xl sm:text-5xl md:text-6xl leading-tight mb-6">
            Nanny Share Resources
          </h1>
          <p className="text-white/80 Livvic-Medium text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Helpful guides to help you understand nanny shares and make confident childcare decisions.
          </p>
        </div>
      </div>

      {/* List of Articles */}
      <div className="container mx-auto max-w-6xl px-4 my-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {articles.map((article) => (
            <div key={article.key} className="flex flex-col">
              <CommunityResourceCard
                title={article.title}
                exerpt={article.excerpt}
                time={article.time}
                img={article.img}
                // We pass the slug here so the card knows where to link to
                slug={article.slug}
                // Was hardcoded true, so a cover image uploaded in the admin
                // console rendered nowhere. Now per-article: one with a cover
                // shows it, one without keeps the text-led card it has today.
                hideImage={!article.img}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
