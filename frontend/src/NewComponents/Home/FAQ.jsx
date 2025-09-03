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
      "Can I hire someone who also teaches a skill, like piano or Spanish?",
    answer:
      "Famlink helps families connect with a variety of caregivers, including private educators, swim instructors, music teachers, and household managers. Whether you need a full-time nanny, a part-time tutor, or a weekend babysitter, you can find the right fit for your needs.",
  },
  {
    question: "Is this platform only for nannies?",
    answer:
      "Absolutely! Many caregivers on Famlink offer additional skills beyond childcare. You can specify your preferences when posting a job or searching for candidates.",
  },
  {
    question: "Can I see caregiver pricing before messaging?",
    answer:
      "Yes! Caregiver profiles display their hourly rates, availability, and any additional services they offer, helping you make an informed decision before reaching out.",
  },
  {
    question: "What if I hire someone and it doesn't work out?",
    answer:
      "If you need to make a change, Famlink allows you to keep your job posting active and find a new caregiver easily. We also provide contract templates to help set clear expectations upfront.",
  },
  {
    question: "Can I find someone for part-time or after-school hours?",
    answer:
      "Yes! You can filter candidates based on availability, including part-time and after-school care options.",
  },
  {
    question: "Are background checks included or optional?",
    answer:
      "Background checks are optional and can be requested through our platform during the hiring process.",
  },
  {
    question: "Can I favorite or save caregivers I'm interested in?",
    answer:
      "Yes, you can save profiles to revisit later and keep track of your favorite caregivers.",
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
