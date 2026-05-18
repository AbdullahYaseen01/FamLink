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
      "Do I need nanny share experience?",
    answer:
      "No — you can join with or without nanny share experience. Families care most about your childcare background.",
  },
  {
    question: "Can I use FamLink if I don’t have a family yet?",
    answer:
      "Yes — you can get matched with families who are already looking for a nanny share.",
  },
  {
    question: "Can I add a second family to my current job?",
    answer:
      "Yes — you can open your schedule to another family and turn your current role into a nanny share.",
  },
  {
    question: "How does matching work?",
    answer:
      "We show you families nearby based on your availability and preferences. You can request matches and connect once there’s mutual interest.",
  },
  {
    question: "How is pay handled in a nanny share?  ",
    answer:
      "Each family pays a portion of your rate, so you typically earn more than working with just one family.",
  },
  {
    question: "Do I get to choose which families I work with?",
    answer:
      "Yes — you’re always in control. You decide who you connect with and move forward only if it feels right.",
  },
  {
    question: "Can I do a nanny share with my own child as a caregiver?",
    answer: (
      <>
        Yes — you can create a nanny share while caring for your own child.
        Many caregivers choose this setup to stay with their child while also
        earning income.
        <br />
        <br />
        Just keep in mind that this is still a nanny share, meaning you are
        caring for children from another family at the same time. Your rate,
        responsibilities, and expectations should reflect a nanny share
        arrangement.
      </>
    ),
  }
];

const faqs = [
  {
    question:
      "What is a nanny share?",
    answer:
      "A nanny share is a childcare arrangement where two families share one nanny. Families split the cost while children receive personalized care in a smaller home-based setting.",
  },
  {
    question: "Do I need to already have a nanny to use Famlink?",
    answer: (
      <>
        No. Families can:
        <ul>
          <li>• Look for another family to join their current nanny arrangement</li>
          <li>• Look for both a nanny and another family</li>
          <li>• Connect directly with nannies seeking nanny share positions</li>
        </ul>
      </>
    ),
  },
  {
    question: "How does matching work on Famlink?",
    answer:
      "Families and nannies create profiles with details like schedule, location, childcare preferences, and hosting preferences. Users can browse compatible profiles and send match requests  through the platform.",
  },
  {
    question: "What happens after a mutual match?",
    answer:
      "Once there’s a mutual match, families can connect directly through FamLink to discuss schedules, care needs, hosting arrangements, and next steps.",
  },
  {
    question: "How much can families save with a nanny share?",
    answer:
      "Many families pay significantly less than hiring a private nanny on their own since the cost is shared between families. Pricing varies depending on schedule, location, and nanny rates.",
  },
  {
    question: "How close do families need to live?",
    answer:
      "Most nanny shares work best when families live within a short driving distance of each other. Many families prefer matches within 1–5 miles.",
  },
  {
    question: "Can families with different schedules still share a nanny?",
    answer:
      "Yes. Some families share full-time schedules, while others coordinate part-time or after-school care depending on availability and needs.",
  },
  {
    question: "Where does the nanny share take place?",
    answer:
      "Every arrangement is different. Some families host in one consistent home, while others alternate between homes throughout the week.",
  },
  {
    question: "Can children of different ages participate in a nanny share?",
    answer:
      "Yes. Many nanny shares include children of different ages depending on the families' preferences and the nanny’s experience.",
  },
  {
    question: "Can I browse matches before subscribing?",
    answer:
      "Yes. Families can explore profiles and browse compatible matches on Famlink before deciding to upgrade or connect.",
  },
  {
    question: "What types of caregivers are on Famlink?",
    answer: (
      <>
        Famlink includes:
        <ul>
          <li>• Nannies</li>
          <li>• Nanny share caregivers</li>
          <li>• Caregivers already working with families</li>
          <li>• Caregivers looking for nanny share positions</li>
        </ul>
      </>
    ),
  },
  {
    question: "Does Famlink provide payroll services?",
    answer:
      "Famlink helps families connect and manage nanny share arrangements, but families are responsible for handling payroll, taxes, and employment compliance.",
  },
  {
    question: "Can I use Famlink if I only need part-time care?",
    answer: (
      <>
        Famlink includes:
        <ul>
          <li>• Full-time care</li>
          <li>• Part-time care</li>
          <li>• After-school care</li>
          <li>• Summer schedules</li>
          <li>• Flexible arrangements</li>
        </ul>
      </>
    ),
  },
    {
    question: "Is nanny sharing better than daycare?",
        answer: (
      <>
        Every family is different, but many parents choose nanny sharing because it offers:
        <ul>
          <li>• Smaller group care </li>
          <li>• More flexibility</li>
          <li>• Personalized attention  </li>
          <li>• A home-based environment  </li>
          <li>• Built-in socialization  </li>
        </ul>
      </>
    ),
  },
    {
    question: "What if a match doesn’t work out?",
    answer:
      "Families can continue browsing and connecting with other compatible matches on the platform.",
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
