import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getOutgoingRequestsThunk } from "../Components/Redux/matchSlice";
import Loader from "../Components/subComponents/loader";
import MatchesEmptyState from "./MatchesEmptyState";
import {
  formatShareTypeLine,
  sentStatusLabel,
  viewedTypeFromMatch,
} from "./matchesCompatibility";
import "./matchesTab.css";

const initials = (name) => {
  if (!name) return "";
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
};

const OutgoingRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { outgoingMatches: matches, isMatchLoading, outgoingPagination } = useSelector(
    (state) => state.matchRequest
  );
  const hasMore = outgoingPagination?.hasMore;
  const [page, setPage] = useState(1);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    dispatch(getOutgoingRequestsThunk({ page: 1, limit: 10 }))
      .unwrap()
      .catch(() => {})
      .finally(() => setHasFetched(true));
  }, [dispatch]);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (
      scrollTop + windowHeight >= documentHeight - 200 &&
      !isMatchLoading &&
      hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  }, [isMatchLoading, hasMore]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (page > 1) {
      dispatch(getOutgoingRequestsThunk({ page, limit: 10 }));
    }
  }, [page, dispatch]);

  return (
    <div>
      {isMatchLoading && <Loader />}

      {hasFetched && !isMatchLoading && matches?.length === 0 && (
        <MatchesEmptyState
          variant="sent"
          headline="No sent requests yet"
          line="Match requests you send will appear here while you wait for a response."
          cta="Browse Matches"
          onCta={() => navigate("/dashboard")}
        />
      )}

      {matches?.map((profile) => {
        const isFamily = profile.userId?.type === "Parents";
        const img = isFamily ? profile.userId?.imageUrl : profile.imageFile;
        const name = profile.userId?.name || "";
        const typeLine = formatShareTypeLine(viewedTypeFromMatch(profile), profile.userId?.type);
        return (
          <div key={profile._id} className="fl-sent-row">
            <div className="fl-sent-avatar Livvic-Bold">
              {img ? <img src={img} alt="" /> : initials(name)}
            </div>
            <div className="fl-sent-copy">
              <p className="fl-sent-name Livvic-Bold">{name}</p>
              <p className="fl-sent-type Livvic">{typeLine}</p>
            </div>
            <span className="fl-sent-pill Livvic-Medium">{sentStatusLabel(profile.status)}</span>
          </div>
        );
      })}

      {!hasMore && matches?.length > 0 && (
        <p className="text-center py-5">No more profiles</p>
      )}
    </div>
  );
};

export default OutgoingRequests;
