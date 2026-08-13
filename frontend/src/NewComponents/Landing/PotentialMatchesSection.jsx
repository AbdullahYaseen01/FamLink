import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { EnvironmentOutlined } from "@ant-design/icons";
import { api } from "../../Config/api";
import { landingSessionHeaders } from "../../Config/landingFamSession";
import Button from "../Button";

const PlaceholderCard = () => (
  <div className="relative w-full max-w-[280px] h-[220px] rounded-2xl bg-white border border-gray-100 overflow-hidden">
    <div className="absolute inset-0 backdrop-blur-md bg-white/40 flex items-center justify-center">
      <div className="w-16 h-16 rounded-xl bg-[#E8EEFF]" />
    </div>
    <div className="p-4 blur-sm select-none opacity-60">
      <div className="w-14 h-14 rounded-xl bg-[#AEC4FF] mb-3" />
      <p className="Livvic-SemiBold text-primary">Member</p>
      <p className="text-sm text-gray-500">Nearby</p>
      <p className="text-sm text-gray-400 mt-2">Share details hidden</p>
    </div>
  </div>
);

const PreviewCard = ({ profile }) => (
  <div className="w-full max-w-[280px] h-[220px] rounded-2xl bg-white border border-gray-100 p-4 flex flex-col">
    <div
      className="rounded-xl w-14 h-14 flex items-center justify-center text-white Livvic-SemiBold mb-3"
      style={{ backgroundColor: "#AEC4FF" }}
    >
      FL
    </div>
    <p className="Livvic-SemiBold text-primary text-base">
      {profile.displayName || "FamLink member"}
    </p>
    <p className="text-[#555555] Livvic-Medium flex gap-1 text-sm mb-2">
      <EnvironmentOutlined className="text-base" />
      {profile.displayLocation || "Nearby"}
    </p>
    {profile.careType && (
      <span className="rounded-lg w-fit py-1 px-3 bg-[#ECF1FF] text-primary Livvic-SemiBold text-xs mb-2">
        {profile.careType}
      </span>
    )}
    <p className="text-xs text-gray-400 mt-auto">Preview — create an account to connect</p>
  </div>
);

/**
 * Post-initial-onboarding matches: active = 2 real + 1 blurred; waitlist = 3 placeholders.
 */
export default function PotentialMatchesSection({ enabled }) {
  const [areaMode, setAreaMode] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/landing/matches", {
          headers: landingSessionHeaders(),
        });
        if (cancelled) return;
        setAreaMode(data?.areaMode || "waitlist");
        setProfiles(Array.isArray(data?.profiles) ? data.profiles : []);
      } catch {
        if (!cancelled) {
          setAreaMode("waitlist");
          setProfiles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) return null;

  const isWaitlist = areaMode !== "active";

  return (
    <section className="mt-10 mb-8" aria-label="Post-Initial-Onboarding Potential Matches">
      <h2 className="text-xl sm:text-2xl Livvic-Bold text-[#001243] text-center mb-2">
        Post-Initial-Onboarding Potential Matches
      </h2>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-md mx-auto">
        {isWaitlist
          ? "We're not matching in your area yet — join the waitlist with a free account."
          : "Here are preview profiles near you. Create a free account to unlock full matches."}
      </p>

      {loading ? (
        <p className="text-center text-gray-400 text-sm">Loading previews…</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {isWaitlist ? (
            <>
              <PlaceholderCard />
              <PlaceholderCard />
              <PlaceholderCard />
            </>
          ) : (
            <>
              {(profiles[0] ? <PreviewCard profile={profiles[0]} /> : <PlaceholderCard />)}
              {(profiles[1] ? <PreviewCard profile={profiles[1]} /> : <PlaceholderCard />)}
              <PlaceholderCard />
            </>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <NavLink to="/joinNow">
          <Button
            btnText="Create a Free Account"
            className="bg-[#AEC4FF] !px-8 !py-3 !rounded-xl"
          />
        </NavLink>
      </div>
    </section>
  );
}
