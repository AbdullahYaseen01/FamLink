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

const caregiverFaqs = [
  {
    question:
      "Do I need previous nanny share experience to join Famlink?",
    answer:
      "No — nanny share experience isn’t required. If you have it, highlight it on your profile, as many families value it. If you’re new, focus on your experience caring for multiple children at once.",
  },
  {
    question: "How does adding a second family to my current schedule work?",
    answer:
      "Post your availability, including your location, the child you currently care for, and your open days and hours. Families can view your profile and request to connect directly through Famlink",
  },
  {
    question: "What if the two families have different schedules?",
    answer:
      "FamLink prioritizes matches with overlapping schedules, so the families you see are already aligned with your availability. You can refine this further by setting your exact hours.",
  },
  {
    question: "Do both families need to be in the same location?",
    answer:
      "Ideally, yes. Most successful nanny shares involve families within 1–2 miles of each other to keep logistics simple. You can set your preferred radius in your profile.",
  },
  {
    question: "How is pay handled in a nanny share?",
    answer:
      "Each family typically pays a portion of your rate, allowing you to earn more overall than with a single-family job. Final pay structure is agreed upon directly with both families.",
  },
  {
    question: " Do I get to choose which families I work with?",
    answer:
      "Yes — you’re always in control. Review profiles, chat with families, and only move forward if it feels like the right fit.",
  },
  {
    question: "What happens if one family leaves the share?",
    answer:
      "Your profile stays active, so you can quickly connect with a new family. Many nannies find a replacement within a few weeks.",
  },
  {
    question: "Can I use Famlink if I’m not currently working with a family?",
    answer:
      "Yes — Famlink supports both nannies with an existing family and those looking for their first nanny share role.",
  },
  {
    question: "How do I know if a nanny share is a good fit for me?",
    answer:
      "Nanny shares are a great fit if you’re comfortable caring for multiple children, coordinating with two families, and following a shared schedule.",
  },
  {
    question: "Do I need a contract for a nanny share?",
    answer:
      "Yes — having a clear agreement is strongly recommended. It helps outline pay, schedule, responsibilities, and expectations for everyone involved.",
  },
];

const faqs = [
  {
    question:
      "Do I need my own nanny already?",
    answer:
      "No — you can join whether you already have a nanny or are looking for one.",
  },
  {
    question: "How much will I actually save?",
    answer:
      "Most families save 30–50% compared to hiring a private nanny, since costs are shared.",
  },
  {
    question: "How does the matching actually work?",
    answer:
      "We show you nearby families and caregivers based on your preferences. You can request matches and connect once there’s mutual interest.",
  },
  {
    question: "Is there a commitment or contract?",
    answer:
      "No long-term lock-in. Most shares start with 1-3 month trial periods. We recommend simple contracts covering pay, schedules, vacations, and cancellation (templates available).",
  },
  {
    question: "How fast can I get matched?",
    answer:
      "You can start seeing matches immediately after signing up. Most families begin connecting the same day.",
  },
  {
    question: "What happens after we match?",
    answer:
      "Once both sides are interested, you can message directly to coordinate details and set up a meet-and-greet.",
  },
  {
    question: "What if a match doesn’t work out?",
    answer:
      "No problem — you can continue exploring other matches anytime.",
  },

];

function FAQ({ business, caregiver }) {
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
                  className={`my-4 ${openIndex === i ? "rounded-[20px]" : "rounded-full"
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
              : caregiver ? caregiverFaqs.map((faq, i) => (
                <div
                  key={i}
                  className={`my-4 ${openIndex === i ? "rounded-[20px]" : "rounded-full"
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
              )) : faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`my-4 ${openIndex === i ? "rounded-[20px]" : "rounded-full"
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
