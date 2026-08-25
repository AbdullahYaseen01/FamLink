import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getOutgoingRequestsThunk } from "../Components/Redux/matchSlice";
import Loader from "../Components/subComponents/loader";
import MatchesEmptyState from "./MatchesEmptyState";
import { formatDisplayName, profileTypeLabel } from "./matchesHelpers";
import { CARE_TYPE_LABELS } from "../Config/scheduleFormat";
import "./MatchesFamBanner.css";

const initials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (/family/i.test(name) && parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const sentSubtitle = (profile) => {
  const type = profile.userId?.type;
  const role = profileTypeLabel(type);
  const raw = profile.nannyShareType || profile.careType || profile.currentSchedule;
  const care = CARE_TYPE_LABELS[String(raw || "").toLowerCase()] || (raw ? String(raw) : "Flexible");
  const city = profile.userId?.location?.city || profile.userId?.location?.neighborhood;
  const miles = typeof profile.distanceMiles === "number" ? `${profile.distanceMiles.toFixed(1)} mi` : null;
  return [role, care, city, miles].filter(Boolean).join(" · ");
};

const sentStatus = (profile) => {
  if (profile.status && profile.status !== "pending") return null;
  const created = profile.createdAt || profile.updatedAt;
  const ageMs = created ? Date.now() - new Date(created).getTime() : 0;
  if (ageMs > 7 * 24 * 60 * 60 * 1000) return { label: "No response", kind: "none" };
  return { label: "Awaiting reply", kind: "awaiting" };
};

const SentCard = ({ profile }) => {
  const type = profile.userId?.type;
  const name = formatDisplayName(profile.userId?.name);
  const img = type === "Parents" ? profile.userId?.imageUrl : profile.imageFile || profile.userId?.imageUrl;
  const status = sentStatus(profile);
  const avatarClass = type === "Nanny" ? "fl-sent-card__avatar--nanny" : "fl-sent-card__avatar--family";

  return (
    <div className="fl-sent-card">
      <div className={`fl-sent-card__avatar ${avatarClass}`}>
        {img ? <img src={img} alt={name} /> : initials(profile.userId?.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="fl-sent-card__name truncate">{name}</div>
        <div className="fl-sent-card__sub truncate">{sentSubtitle(profile)}</div>
      </div>
      {status && <div className={`fl-sent-pill fl-sent-pill--${status.kind}`}>{status.label}</div>}
    </div>
  );
};

const OutgoingRequests = ({ onBrowse }) => {
  const dispatch = useDispatch();
  const { outgoingMatches: matches, isMatchLoading, outgoingPagination } = useSelector(
    (state) => state.matchRequest
  );
  const hasMore = outgoingPagination?.hasMore;
  const [page, setPage] = useState(1);
  const [hasFetched, setHasFetched] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    dispatch(getOutgoingRequestsThunk({ page: 1, limit: 10 }))
      .unwrap()
      .catch(() => {})
      .finally(() => setHasFetched(true));
  }, [dispatch]);

  useEffect(() => {
    if (page > 1) dispatch(getOutgoingRequestsThunk({ page, limit: 10 }));
  }, [page, dispatch]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isMatchLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isMatchLoading, matches?.length]);

  return (
    <div className="flex flex-col gap-4">
      {isMatchLoading && !hasFetched && <Loader />}

      {hasFetched && !isMatchLoading && matches?.length === 0 && (
        <MatchesEmptyState
          variant="sent"
          headline="No sent requests yet"
          description="When you send a match request to a profile, you'll be able to track its status here — whether it's pending, accepted, or declined."
          ctaLabel="Browse Matches"
          onCta={onBrowse}
        />
      )}

      {matches?.map((profile) => (
        <SentCard key={profile._id} profile={profile} />
      ))}

      {matches?.length > 0 && <div ref={sentinelRef} />}
    </div>
  );
};

export default OutgoingRequests;
