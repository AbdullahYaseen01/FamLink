import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { articlesData } from "../../data/articlesData";
import SEOMetaData from "../SEOMetaData";
import { resourcesIndexMeta } from "../../seo/routeMeta";
import CommunityResourceCard from "../CommunityResourceCard";
import { ArrowLeft } from "lucide-react";

const ResourcesPage = () => {
  const navigate = useNavigate();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#f9fafb] min-h-screen">
      {/* SEO for the Resources directory page */}
      <SEOMetaData {...resourcesIndexMeta()} />

      {/* Stylish Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#E7FCFF] to-[#f9fafb] border-b border-gray-100 py-2 px-4">
        {/* Top Navigation Bar for returning to homepage */}
        <div className="container mx-auto max-w-6xl flex items-center pt-2 pb-4 relative z-20">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-[#006A7C] hover:text-[#001243] transition-colors bg-transparent border-none cursor-pointer Livvic-Medium text-[15px]"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to FamLink
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#94f3ff]/40 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h1 className="Livvic-Bold text-[#001243] text-4xl sm:text-5xl md:text-6xl leading-tight mb-6">
            Nanny Share Resources
          </h1>
          <p className="text-[#555] Livvic-Medium text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Helpful guides to help you understand nanny shares and make confident childcare decisions.
          </p>
        </div>
      </div>

      {/* List of Articles */}
      <div className="container mx-auto max-w-6xl px-4 my-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {articlesData.map((article) => (
            <div key={article.id} className="flex flex-col">
              <CommunityResourceCard
                title={article.title}
                exerpt={article.excerpt}
                time={article.time}
                img={article.img}
                // We pass the slug here so the card knows where to link to
                slug={article.slug}
                hideImage={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
