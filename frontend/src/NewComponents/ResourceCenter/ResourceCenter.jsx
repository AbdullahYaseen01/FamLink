import React, { useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Header from "../Header";
import Footer from "../Footer/Footer";
import FAQ from "../Home/FAQ";
import SEOMetaData from "../SEOMetaData";
import CostEstimation from "../NannyShare/CostEstimation";
import Button from "../Button";
import { RESOURCES } from "./resourcesData";
import LeadMagnetModal from "./LeadMagnetModal";

// Category 4.2 — The Nanny Share Resource Center. A public, top-of-funnel hub
// that captures high-intent "research phase" visitors with three lead magnets:
// an interactive cost calculator (rendered inline) plus two gated downloads that
// open the email-capture modal.
export default function ResourceCenter() {
  const [activeResource, setActiveResource] = useState(null);
  const calculatorRef = useRef(null);

  const handleCardCta = (resource) => {
    if (resource.type === "tool") {
      calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setActiveResource(resource);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOMetaData
        title="Free Nanny Share Resources | Cost Calculator, Agreement Template & Payroll Guide"
        description="Free tools for setting up a nanny share: an interactive cost calculator, a ready-to-fill nanny share agreement template, and a plain-English payroll & tax guide."
        canonical="https://famlink.care/nanny-share-resources"
      />

      <Header />

      {/* ── Hero ── */}
      <section className="bg-[#001243] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-[#AEC4FF] text-xs Livvic-Bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={14} /> Nanny Share Resource Center
          </div>
          <h1 className="Livvic-Bold text-3xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl mx-auto">
            Everything you need to set up a nanny share
          </h1>
          <p className="text-white/60 text-base sm:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
            Free calculators, templates, and guides — built with families who've done it.
            No fluff, no account required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button
              btnText="Explore the resources"
              className="bg-[#AEC4FF] text-gray-900 px-7 py-3.5"
              action={() =>
                document.getElementById("resources-grid")?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </div>
        </div>
      </section>

      {/* ── Resource cards ── */}
      <section id="resources-grid" className="bg-[#F6F3EE] py-14 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="Livvic-Bold text-3xl sm:text-4xl text-gray-900">Free nanny share resources</h2>
            <p className="text-gray-500 mt-3 text-base sm:text-lg leading-relaxed">
              Whether you're comparing costs or drawing up an agreement, start here.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {RESOURCES.map((resource) => {
              const Icon = resource.icon;
              return (
                <div
                  key={resource.slug}
                  className="bg-white rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: resource.accent.bg }}
                  >
                    <Icon size={26} style={{ color: resource.accent.fg }} />
                  </div>
                  <p
                    className="text-xs Livvic-Bold uppercase tracking-wider mb-1.5"
                    style={{ color: resource.accent.fg }}
                  >
                    {resource.eyebrow}
                  </p>
                  <h3 className="Livvic-Bold text-xl text-gray-900 leading-snug mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1">
                    {resource.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCardCta(resource)}
                    className="mt-6 inline-flex items-center gap-1.5 Livvic-Bold text-gray-900 hover:gap-2.5 transition-all"
                  >
                    {resource.cta} <ArrowRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Embedded interactive calculator ── */}
      <section ref={calculatorRef} id="calculator" className="bg-white scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-[#F6F3EE] rounded-[24px] overflow-hidden">
            <CostEstimation />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white py-14 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="Livvic-Bold text-3xl sm:text-4xl text-gray-900">How a nanny share works</h2>
            <p className="text-gray-500 mt-3 text-base sm:text-lg">Three steps from idea to first day.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: "1", t: "Compare the costs", d: "Use the calculator to see what a share saves your family versus a solo nanny." },
              { n: "2", t: "Match with a family", d: "Find a nearby family on a similar schedule so care lines up for everyone." },
              { n: "3", t: "Put it in writing", d: "Use the agreement template and payroll guide to set it up cleanly from day one." },
            ].map((step) => (
              <div key={step.n} className="bg-[#F6F3EE] rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-[#AEC4FF] text-gray-900 Livvic-Bold flex items-center justify-center mb-4">
                  {step.n}
                </div>
                <h3 className="Livvic-Bold text-lg text-gray-900 mb-2">{step.t}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <a href="/find-nanny-share">
              <Button btnText="Find your nanny share match" className="bg-[#FFADE1] px-7 py-3.5 text-gray-900" />
            </a>
          </div>
        </div>
      </section>

      <FAQ />
      <Footer />

      {activeResource && (
        <LeadMagnetModal resource={activeResource} onClose={() => setActiveResource(null)} />
      )}
    </div>
  );
}
