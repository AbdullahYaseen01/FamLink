import { Plus, Minus } from "lucide-react";
import React, { useState } from "react";

const businessFaqs = [
  {
    question: "I own a childcare-related business. How can Famlink help me?",
    answer:
      "Whether you run a daycare, a tutoring center, or an after-school program, Famlink helps you connect with families searching for your services. You can create a business profile, list your services, and even hire staff through our job board.",
  },
  {
    question: "Can I post job listings for my business?",
    answer:
      "Yes! Businesses can post job listings for positions like childcare providers, private instructors, or administrative staff.",
  },
  {
    question: "How does Famlink help businesses get discovered?",
    answer:
      "Business listings appear in family searches based on location and service needs. Premium businesses also receive priority placement and additional marketing tools.",
  },
];

const faqs = [
  {
    question:
      "Do I need my own nanny already?",
    answer:
      "No. We match 70% of families with both a share partner and nanny. If you have one, we help you find someone to split costs.",
  },
  {
    question: "How much will I actually save?",
    answer:
      "Oakland nanny rates average $28-35/hr. Nanny shares cut that 40-50% per family. A $2,400/month solo nanny becomes ~$1,300/family.",
  },
  {
    question: "How close together do we need to live?",
    answer:
      "2-3 miles works best for logistics. Rockridge ↔ Temescal, North Berkeley ↔ Albany, Elmwood ↔ South Berkeley all match frequently.",
  },
  {
    question: "Will this work for after-school care?",
    answer:
      "Yes. One nanny picks up both kids from the same school, does homework/activities 3-6pm. Each family pays half of after-school rates. ",
  },
  {
    question: "Do our kids need to be the same age?",
    answer:
      "±12 months ideal for play/schedules, but we match siblings (infant+preschooler), same-age multiples, preschool+after-school combos.",
  },
  {
    question: "How does the matching actually work?",
    answer:
      "We score families by location (1-2mi), kid ages (±6mo), schedules (80% overlap), parenting style. You get your top 2-3 matches.",
  },
  {
    question: "Is there a commitment or contract?",
    answer:
      "No long-term lock-in. Most shares start with 1-3 month trial periods. We recommend simple contracts covering pay, schedules, vacations, and cancellation (templates available).",
  },
    {
    question: "What does Famlink cost?",
    answer:
      "Free to get matched and browse families. Just $12.99/month unlocks direct messaging with share families.",
  },
      {
    question: "How fast can I get matched?",
    answer:
      "Sign up now to browse potential matches immediately, or wait for our personalized email matches within 48 hours. Most families start messaging share partners same day.",
  },
];

function FAQ({ business }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto my-16 sm:my-20 lg:my-24 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center items-center">
        <div className="flex flex-col items-center w-full max-w-[60rem]">
          <div className="rounded-full border-2 border-[#EEEEEE] Livvic-SemiBold text-lg w-fit py-2 px-6 mx-auto">
            FAQ
          </div>
          <h1 className="Livvic-Bold text-4xl sm:text-5xl lg:leading-[16px] mt-12 text-center">
            Frequently Asked Questions
          </h1>

          <div className="mt-16 w-full">
            {business
              ? businessFaqs.map((faq, i) => (
                  <div
                    key={i}
                    className={`my-4 ${
                      openIndex === i ? "rounded-[20px]" : "rounded-full"
                    } p-4 sm:p-6 shadow-soft w-full`}
                  >
                    <button
                      className="w-full flex justify-between items-center text-left"
                      onClick={() => toggleFAQ(i)}
                    >
                      <p className="Livvic-SemiBold leading-[16px] pr-4">
                        {faq.question}
                      </p>
                      {openIndex === i ? (
                        <Minus size={20} className="flex-shrink-0" />
                      ) : (
                        <Plus size={20} className="flex-shrink-0" />
                      )}
                    </button>

                    {openIndex === i && (
                      <div className="pb-6 mt-6 text-[#5C6566] Livvic text-base">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))
              : faqs.map((faq, i) => (
                  <div
                    key={i}
                    className={`my-4 ${
                      openIndex === i ? "rounded-[20px]" : "rounded-full"
                    } p-4 sm:p-6 shadow-soft w-full`}
                  >
                    <button
                      className="w-full flex justify-between items-center text-left"
                      onClick={() => toggleFAQ(i)}
                    >
                      <p className="Livvic-SemiBold leading-[16px] pr-4">
                        {faq.question}
                      </p>
                      {openIndex === i ? (
                        <Minus size={20} className="flex-shrink-0" />
                      ) : (
                        <Plus size={20} className="flex-shrink-0" />
                      )}
                    </button>

                    {openIndex === i && (
                      <div className="pb-6 mt-6 text-[#5C6566] Livvic text-base">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
