import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Inbox, MessageCircle, Send as SendIcon } from "lucide-react";
import { getIncomingRequestsThunk } from "../Components/Redux/matchSlice";
import { getChatsThunk } from "../Components/Redux/chatSlice";
import { viewCurrentUserProfileThunk } from "../Components/Redux/nannyShareSlice";
import IncomingRequests from "./IncomingRequests";
import OutgoingRequests from "./OutgoingRequests";
import MatchesMessages from "./MatchesMessages";
import { buildFamIntro, DEFAULT_FAM_INTRO } from "./matchesCompatibility";
import "./matchesTab.css";

const TAB_ALIASES = {
  incoming: "incoming",
  requests: "incoming",
  outgoing: "outgoing",
  sent: "outgoing",
  messages: "messages",
  declined: "incoming",
};

const MatchRequests = () => {
  const [val, setVal] = useState("incoming");
  const [showFamHeader, setShowFamHeader] = useState(true);
  const location = useLocation();
  const dispatch = useDispatch();

  const { incomingMatches, isMatchLoading, incomingPagination } = useSelector(
    (s) => s.matchRequest
  );
  const chatList = useSelector((s) => s.chat?.chatList);
  const currentProfile = useSelector((s) => s.postNannyShare?.currentProfile);

  const hasMore = incomingPagination.hasMore;
  const [page, setPage] = useState(1);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    dispatch(getIncomingRequestsThunk({ page: 1, limit: 10 }))
      .unwrap()
      .finally(() => setHasFetched(true));
    dispatch(getChatsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (!currentProfile) dispatch(viewCurrentUserProfileThunk());
  }, [dispatch, currentProfile]);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (
      scrollTop + windowHeight >= documentHeight - 200 &&
      !isMatchLoading &&
      hasMore &&
      val === "incoming"
    ) {
      setPage((prev) => prev + 1);
    }
  }, [isMatchLoading, hasMore, val]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (page > 1) {
      dispatch(getIncomingRequestsThunk({ page, limit: 10 }));
    }
  }, [page, dispatch]);

  useEffect(() => {
    if (location.state?.initialTab) {
      setVal(TAB_ALIASES[location.state.initialTab] || "incoming");
    }
  }, [location.state]);

  const handleClick = (e) => {
    const value = e.currentTarget.getAttribute("data-value");
    setVal(value);
  };

  const pendingMatches = incomingMatches?.filter((m) => m.status === "pending");
  const requestCount = pendingMatches?.length || 0;
  const chatCount = useMemo(
    () => (chatList || []).filter((c) => c?.otherParticipant?.name !== "Admin").length,
    [chatList]
  );
  const famIntro = buildFamIntro({ pendingCount: requestCount, chatCount }) || DEFAULT_FAM_INTRO;
  const famActive = requestCount > 0 || chatCount > 0;

  return (
    <div className="padding-navbar1 Quicksand lg:w-[80%] mx-2 sm:mx-4">
      <div className="rounded-xl my-5">
        {showFamHeader && (
          <div className="fl-fam-header">
            <div className="fl-fam-header__title-row">
              <div className="fl-fam-header__brand">
                <img src="/logo3.png" alt="" className="fl-fam-header__logo" />
                <span className="fl-fam-header__name Livvic-Bold">Fam</span>
                <span
                  className={`fl-fam-header__status${famActive ? "" : " is-idle"}`}
                  aria-hidden="true"
                />
              </div>
              <button
                type="button"
                className="fl-fam-header__close"
                aria-label="Dismiss Fam"
                onClick={() => setShowFamHeader(false)}
              >
                ×
              </button>
            </div>
            <p className="fl-fam-header__intro Livvic">{famIntro}</p>
          </div>
        )}

        <div className="pb-10">
          <div className="fl-matches-tabs">
            <button
              type="button"
              data-value="incoming"
              onClick={handleClick}
              className={`fl-matches-tab Livvic-Medium${val === "incoming" ? " is-active" : ""}`}
            >
              <Inbox size={15} strokeWidth={1.8} />
              Requests
              {requestCount > 0 && (
                <span className="fl-matches-tab__badge fl-matches-tab__badge--requests">
                  {requestCount}
                </span>
              )}
            </button>
            <button
              type="button"
              data-value="messages"
              onClick={handleClick}
              className={`fl-matches-tab Livvic-Medium${val === "messages" ? " is-active" : ""}`}
            >
              <MessageCircle size={15} strokeWidth={1.8} />
              Messages
              {chatCount > 0 && (
                <span className="fl-matches-tab__badge fl-matches-tab__badge--messages">
                  {chatCount}
                </span>
              )}
            </button>
            <button
              type="button"
              data-value="outgoing"
              onClick={handleClick}
              className={`fl-matches-tab Livvic-Medium${val === "outgoing" ? " is-active" : ""}`}
            >
              <SendIcon size={15} strokeWidth={1.8} />
              Sent
            </button>
          </div>

          <div className="mt-2 min-h-[calc(100vh-150px)]">
            {val === "incoming" && (
              <IncomingRequests
                matches={pendingMatches}
                isMatchLoading={isMatchLoading}
                hasMore={hasMore}
                hasFetched={hasFetched}
              />
            )}
            {val === "messages" && (
              <MatchesMessages onViewRequests={() => setVal("incoming")} />
            )}
            {val === "outgoing" && <OutgoingRequests />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchRequests;
