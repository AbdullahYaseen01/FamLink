import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { getOutgoingRequestsThunk } from "../Components/Redux/matchSlice";
import Loader from "../Components/subComponents/loader";
import MatchesEmptyState from "./MatchesEmptyState";
import { formatDisplayName, userTypeLabel } from "./matchesHelpers";

const SentCard = ({ profile }) => {
  const type = profile.userId?.type;
  const name = formatDisplayName(profile.userId?.name);
  const userType = userTypeLabel({
    type,
    hasNanny: profile.hasNanny,
    hasFamily: profile.hasFamily,
  });
  const img = type === "Parents" ? profile.userId?.imageUrl : profile.imageFile;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100">
      <div className="w-12 h-12 rounded-[12px] overflow-hidden shrink-0">
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Avatar
            size="48"
            color="#AEC4FF"
            fgColor="#0D134C"
            className="Livvic-Bold"
            name={profile.userId?.name?.split(" ").slice(0, 2).join(" ")}
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="Livvic-Bold text-base text-[#0D134C] truncate">{name}</p>
        <p className="Livvic text-sm text-gray-400 truncate">{userType}</p>
      </div>
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
    <div className="flex flex-col gap-2">
      {isMatchLoading && !hasFetched && <Loader />}

      {hasFetched && !isMatchLoading && matches?.length === 0 && (
        <MatchesEmptyState
          variant="sent"
          headline="No sent requests yet"
          description="Match requests you send will appear here while you wait for a response."
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
