import React from "react";
import Button from "../Button";
import CommunityResourceCard from "../CommunityResourceCard";
import { NavLink } from "react-router-dom";

import { articlesData as communityResource } from "../../data/articlesData";

function Community() {
  return (
    <div className="container Livvic">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-0 mb-[36px]">
        <div>
          <h2 className="Livvic-Bold text-[48px] text-black leading-tight">
            Nanny Share Resources
          </h2>
          <p className="text-lg sm:text-[20px] text-[#00000099] Livvic-Medium mt-2">
            Helpful guides to help you understand nanny shares and make confident childcare decisions.
          </p>
        </div>
        <div className="sm:self-end">
          <NavLink to="/resources">
            <Button
              btnText={"View all Resources"}
              className="text-[#001243] bg-[#94F3FF] hover:opacity-90 w-full sm:w-auto"
            />
          </NavLink>
        </div>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[22px]"> */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 mt-6">
        {communityResource.map((resource, i) => (
          <div key={i} className="flex-1 flex flex-col">
            <CommunityResourceCard
              title={resource.title}
              exerpt={resource.excerpt}
              author={resource.author}
              time={resource.time}
              replyCount={resource.replyCount}
              img={resource.img}
              slug={resource.slug}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Community;
