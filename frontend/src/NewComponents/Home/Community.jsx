import React from "react";
import Button from "../Button";
import CommunityResourceCard from "../CommunityResourceCard";
import { NavLink } from "react-router-dom";

const communityResource = [
  {
    title: "Balancing screen time without guilt",
    excerpt:
      "I used to feel so bad letting my 4-year-old watch cartoons while I caught up on emails. Over time, I realized it’s all about balance, not perfection.",
    author: "@OaklandMom",
    img: "/blog1.avif",
    replyCount: 42,
    time: "2",
  },
  {
    title: "Setting boundaries as a nanny",
    excerpt:
      "I love caring for the kids, but lately I’ve been asked to do errands and laundry that weren’t in my contract. How do you politely draw the line?",
    author: "@NannyTracy",
    img: "/blog2.avif",
    replyCount: 19,
    time: "5",
  },
  {
    title: "Best bedtime routines for toddlers",
    excerpt:
      "Our 2-year-old fights bedtime every night. Curious what routines or tips other parents use to make evenings calmer and smoother.",
    author: "@SarahPatel",
    img: "/blog3.avif",
    replyCount: 27,
    time: "1",
  },
]

function Community() {
  return (
    <div className="container Livvic">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="Livvic-Bold text-4xl sm:text-5xl">
            Nanny Share Resources
          </h1>
          <p className="text-lg sm:text-[20px] text-[#00000099] Livvic mt-4 sm:mt-6">
            Every family has different needs. We help you find care that
            actually fits yours.
          </p>
        </div>
        <div className="sm:self-start">
          <NavLink to="/joinNow">
            <Button
              btnText={"View all Resources"}
              className="text-primary bg-[#94f3ff] w-full sm:w-auto"
            />
          </NavLink>
        </div>
      </div>

      {/* <div className="flex gap-3 sm:gap-4 my-4 sm:my-6 overflow-x-auto pb-2 sm:pb-0 scrollbar-custom">
        <div className="p-3 sm:p-4 rounded-full bg-[#9FEEF8] text-[#00333B] Livvic-SemiBold whitespace-nowrap text-sm sm:text-base">
          Tips for Parents
        </div>
        <div className="p-3 sm:p-4 rounded-full bg-[#DEF1F4] text-[#00000099] Livvic-SemiBold whitespace-nowrap text-sm sm:text-base">
          Tips for Nannies
        </div>
        <div className="p-3 sm:p-4 rounded-full bg-[#DEF1F4] text-[#00000099] Livvic-SemiBold whitespace-nowrap text-sm sm:text-base">
          Platform Tips
        </div>
        <div className="p-3 sm:p-4 rounded-full bg-[#DEF1F4] text-[#00000099] Livvic-SemiBold whitespace-nowrap text-sm sm:text-base">
          Special Needs Care
        </div>
        <div className="p-3 sm:p-4 rounded-full bg-[#DEF1F4] text-[#00000099] Livvic-SemiBold whitespace-nowrap text-sm sm:text-base">
          Do it Yourself
        </div>
        <div className="p-3 sm:p-4 rounded-full bg-[#DEF1F4] text-[#00000099] Livvic-SemiBold whitespace-nowrap text-sm sm:text-base">
          Nanny Activities
        </div>
        <div className="p-3 sm:p-4 rounded-full bg-[#DEF1F4] text-[#00000099] Livvic-SemiBold whitespace-nowrap text-sm sm:text-base">
          News
        </div>
      </div> */}

      <div className="flex flex-col lg:flex-row gap-4 mt-6">
        {communityResource.map((resource, i) => (
          <CommunityResourceCard
            key={i}
            title={resource.title}
            exerpt={resource.excerpt}
            author={resource.author}
            time={resource.time}
            replyCount={resource.replyCount}
            img={resource.img}
          />
        ))}
      </div>
    </div>
  );
}

export default Community;
