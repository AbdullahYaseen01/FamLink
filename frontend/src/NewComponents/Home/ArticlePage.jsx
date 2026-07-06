import React, { useEffect } from "react";
import { useParams, NavLink, useNavigate } from "react-router-dom";
import { articlesData } from "../../data/articlesData";
import SEOMetaData from "../SEOMetaData";
import Button from "../Button";
import { ArrowLeft } from "lucide-react";

const ArticlePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // Find the specific article based on the URL slug
  const article = articlesData.find((a) => a.slug === slug);

  // Scroll to top when loading a new article
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

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
      <div className="w-full relative h-[40vh] sm:h-[50vh] min-h-[350px]">
        <img 
          src={article.img} 
          alt={article.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 flex flex-col justify-end pb-12 sm:pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-left">
             <span className="inline-block bg-[#e0417a] text-white px-3 py-1 rounded-full text-sm Livvic-SemiBold mb-4 shadow-sm">
                {article.time} min read
             </span>
             <h1 className="text-white text-3xl sm:text-5xl md:text-6xl Livvic-Bold leading-tight drop-shadow-md">
                {article.title}
             </h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 max-w-4xl -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 md:p-14">
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
