import React, { useEffect, useState } from "react";
import { useParams, NavLink, useNavigate } from "react-router-dom";
import { articlesData } from "../../data/articlesData";
import { api } from "../../Config/api";
import SEOMetaData from "../SEOMetaData";
import Button from "../Button";
import { ArrowLeft } from "lucide-react";

// Rough read-time estimate for DB-published blogs, which (unlike the static
// articles) don't carry one.
const readMinutes = (html) => {
  const words = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const ArticlePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Find the specific article based on the URL slug
  const staticArticle = articlesData.find((a) => a.slug === slug);

  // Resources published through the admin blog CMS live in the database rather
  // than in articlesData, and are linked by id (that's what the weekly resources
  // email points at). If the slug isn't a static article, try to load it.
  const [dbArticle, setDbArticle] = useState(null);
  const [loading, setLoading] = useState(!staticArticle);

  useEffect(() => {
    if (staticArticle) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data } = await api.get(`/blogs/${slug}`);
        const blog = data?.data?.blog;
        if (!cancelled && blog) {
          setDbArticle({
            title: blog.title,
            excerpt: blog.excerpt,
            time: readMinutes(blog.content),
            content: (
              <div
                className="space-y-8 text-[#444] text-[15px] sm:text-[16px] leading-relaxed Livvic"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            ),
          });
        }
      } catch {
        if (!cancelled) setDbArticle(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, staticArticle]);

  const article = staticArticle || dbArticle;

  // Scroll to top when loading a new article
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#FDF8F5] px-4 text-center">
        <p className="text-[#666] Livvic-Medium">Loading article…</p>
      </div>
    );
  }

  // If someone types a wrong URL or the article doesn't exist
  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#FDF8F5] px-4 text-center">
        <h1 className="Livvic-Bold text-[#001243] text-4xl mb-4">Article Not Found</h1>
        <p className="text-[#666] Livvic-Medium mb-8">We couldn't find the resource you are looking for.</p>
        <NavLink to="/resources">
          <Button btnText="Back to Resources" className="bg-primary text-white" />
        </NavLink>
      </div>
    );
  }

  return (
    <div className="bg-[#f9fafb] min-h-screen pb-20">
      {/* SEO Tags dynamically generated for this specific article */}
      <SEOMetaData 
        title={`${article.title} | FamLink Resources`} 
        description={article.excerpt} 
      />

      {/* Top Navigation Bar for returning to the main list */}
      <div className="bg-white border-b border-gray-100 py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-4xl flex items-center">
          <button 
            onClick={() => navigate('/resources')}
            className="flex items-center text-[#666] hover:text-primary transition-colors bg-transparent border-none cursor-pointer Livvic-Medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Resources
          </button>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="w-full relative overflow-hidden bg-gradient-to-b from-[#E7FCFF] to-[#f9fafb] border-b border-gray-100 pt-16 pb-24 sm:pb-32 px-4">
        {/* Decorative background glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#94f3ff]/40 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center relative z-10">
           <span className="inline-block bg-[#e0417a] text-white px-4 py-1.5 rounded-full text-sm Livvic-SemiBold mb-6 shadow-sm tracking-wide">
              {article.time} min read
           </span>
           <h1 className="text-[#001243] text-4xl sm:text-5xl md:text-[56px] Livvic-Bold leading-tight max-w-3xl">
              {article.title}
           </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 max-w-4xl -mt-12 sm:-mt-16 relative z-10">
        <div className="bg-white rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-6 sm:p-10 md:p-14 border border-gray-100">
           {/* The actual article text */}
           {article.content}

           {/* Call To Action (CTA) Section - Added to the bottom of EVERY article */}
           <div className="mt-16 pt-10 border-t border-gray-200 text-center bg-[#FDF8F5] p-8 sm:p-12 rounded-2xl">
              <h3 className="text-[#001243] Livvic-Bold text-2xl sm:text-3xl mb-4">
                Ready to find your perfect Nanny Share?
              </h3>
              <p className="text-[#666] Livvic-Medium text-lg mb-8 max-w-2xl mx-auto">
                FamLink helps families connect with nearby parents who have similar schedules, childcare needs, and preferences. Join today to see who is looking in your area!
              </p>
              <NavLink to="/joinNow">
                <Button 
                  btnText="Sign Up for Free" 
                  className="bg-primary text-white text-lg px-8 py-3 w-full sm:w-auto hover:shadow-lg transition-shadow" 
                />
              </NavLink>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
