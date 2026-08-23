import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getChatsThunk } from "../Redux/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { useChats } from "../../Config/useChat";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { clearSelectedContact, setSelectedContact } from "../Redux/selectedContactSlice";
import ChatView from "../subComponents/chatView";
import Loader from "../subComponents/loader";
import { getIncomingRequestsThunk, getOutgoingRequestsThunk } from "../Redux/matchSlice";
import { MatchRequestSuccessModal } from "../../NewComponents/MatchSuccessModal";
import IncomingRequests from "../../NewComponents/IncomingRequests";
import OutgoingRequests from "../../NewComponents/OutgoingRequests";
import MatchesFamBanner from "../../NewComponents/MatchesFamBanner";
import MatchesEmptyState from "../../NewComponents/MatchesEmptyState";
import { formatDisplayName } from "../../NewComponents/matchesHelpers";
import { formatRelativeTime } from "../subComponents/profileCardUpgraded";

const TABS = [
  { id: "requests", label: "Requests" },
  { id: "messages", label: "Messages" },
  { id: "sent", label: "Sent" },
];

function ConversationRow({ contact, onSelect }) {
  const name = formatDisplayName(contact?.otherParticipant?.name);
  const unread = contact?.unReadMessages || 0;
  const preview = contact?.lastMessage?.content || contact?.lastMessage?.message || "Fam: Here are a few things to discuss first: schedule overlap, hosting logistics...";
  const when = formatRelativeTime(contact?.lastMessage?.createdAt || contact?.updatedAt);
  return (
    <button
      type="button"
      className="w-full flex items-start gap-3.5 px-5 py-4 bg-white rounded-2xl border border-[#E8ECF4] text-left"
      onClick={() => onSelect(contact)}
    >
      <div className="w-11 h-11 rounded-[10px] overflow-hidden shrink-0 bg-[#C8D8FF] text-[#001243] Livvic-Bold text-sm flex items-center justify-center">
        {contact?.otherParticipant?.imageUrl ? (
          <img src={contact.otherParticipant.imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Avatar size="44" color="#C8D8FF" fgColor="#001243" className="Livvic-Bold" name={contact?.otherParticipant?.name?.split(" ").slice(0, 2).join(" ")} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="Livvic-Bold text-[14px] text-[#001243] truncate">{name}</p>
          <span className="text-[11px] font-semibold text-[#065F46] bg-[#D1FAE5] rounded-full px-2 py-0.5 shrink-0">Messages</span>
        </div>
        <p className="Livvic text-[12px] text-[#6B7280] truncate mt-0.5">{preview.startsWith("Fam:") ? preview : `Fam: ${preview}`}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[11px] text-[#9CA3AF]">{when || "Just now"}</span>
        {unread > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#001243] text-white text-[10px] font-extrabold flex items-center justify-center">{unread}</span>
        )}
      </div>
    </button>
  );
}

export default function Component() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const chatId = searchParams.get("chatId");
  const dispatch = useDispatch();
  const [tab, setTab] = useState("requests");
  const [isRequestMatchSuccessModal, setIsRequestMatchSuccessModal] = useState(false);
  const [chatUserId, setChatUserId] = useState(null);
  const { incomingMatches, outgoingMatches, isMatchLoading, incomingPagination } = useSelector(
    (state) => state.matchRequest
  );
  const { pathname } = location;
  const selectedContact = useSelector((state) => state.selectedContact.selectedContact);
  const {
    chatList,
    handleSendMessage,
    messages,
    handleCloseChat,
    isLoading,
    isOtherUserTyping,
    emitTyping,
  } = useChats({
    chatId: selectedContact?._id,
    data: selectedContact,
  });
  const { user } = useSelector((s) => s.auth);
  const subscription = useSelector((s) => s.cardData?.subscriptionStatus);
  const { currentProfile } = useSelector((s) => s.postNannyShare);
  const hasMore = incomingPagination?.hasMore;
  const [page, setPage] = useState(1);
  const [hasFetched, setHasFetched] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    dispatch(getIncomingRequestsThunk({ page: 1, limit: 10, status: "pending" }))
      .unwrap()
      .catch(() => {})
      .finally(() => setHasFetched(true));
    dispatch(getOutgoingRequestsThunk({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    const fromState = location.state?.initialTab;
    const fromQuery = searchParams.get("tab");
    const next = fromState || fromQuery;
    if (next === "incoming") setTab("requests");
    else if (next === "outgoing") setTab("sent");
    else if (next === "requests" || next === "messages" || next === "sent") setTab(next);
  }, [location.state, searchParams]);

  const appliedChatIdRef = useRef(null);
  useEffect(() => {
    if (chatId && chatList.length > 0 && appliedChatIdRef.current !== chatId) {
      const chat = chatList.find((c) => c.otherParticipant?._id === chatId);
      if (chat) {
        dispatch(setSelectedContact(chat));
        setTab("messages");
        appliedChatIdRef.current = chatId;
      }
    }
  }, [chatId, chatList, dispatch]);

  useEffect(() => {
    dispatch(getChatsThunk());
  }, [dispatch, chatId]);

  useEffect(() => {
    if (page > 1) dispatch(getIncomingRequestsThunk({ page, limit: 10, status: "pending" }));
  }, [page, dispatch]);

  const pendingMatches = useMemo(
    () => incomingMatches?.filter((m) => m.status === "pending") ?? [],
    [incomingMatches]
  );

  const activeConversations = useMemo(
    () => chatList.filter((c) => c?.otherParticipant?.name !== "Admin"),
    [chatList]
  );

  const unreadCount = useMemo(
    () => activeConversations.reduce((sum, c) => sum + (c?.unReadMessages > 0 ? 1 : 0), 0),
    [activeConversations]
  );

  const handleSelectContact = useCallback((contact) => {
    dispatch(setSelectedContact(contact));
    setTab("messages");
  }, [dispatch]);

  const handleBack = useCallback(() => {
    handleCloseChat();
    dispatch(clearSelectedContact());
  }, [dispatch, handleCloseChat]);

  const handleIncomingScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || tab !== "requests" || selectedContact) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200 && !isMatchLoading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [tab, selectedContact, isMatchLoading, hasMore]);

  const showChat = Boolean(selectedContact) && tab === "messages";

  return (
    <div className="padding-navbar1 bg-[#F4F5F7] h-full overflow-hidden flex flex-col">
      {isRequestMatchSuccessModal && (
        <MatchRequestSuccessModal
          setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal}
          chatUserId={chatUserId}
        />
      )}
      {isMatchLoading && !hasFetched && <Loader />}

      {showChat ? (
        <div className="flex-1 min-h-0 max-w-3xl mx-auto w-full px-0 sm:px-4 sm:py-6">
          <div className="h-full bg-white sm:rounded-2xl sm:border sm:border-gray-100 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex gap-3 items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="Livvic-Medium text-base">Loading…</p>
              </div>
            ) : (
              <ChatView
                messages={messages}
                handleSendMessage={handleSendMessage}
                selectedContact={selectedContact}
                user={user}
                pathname={pathname}
                handleCloseChat={handleCloseChat}
                onBack={handleBack}
                isOtherUserTyping={isOtherUserTyping}
                emitTyping={emitTyping}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col flex-1 min-h-0">
          <MatchesFamBanner
            pendingMatches={pendingMatches}
            outgoingCount={outgoingMatches?.length || 0}
            unreadCount={unreadCount}
            user={user}
            currentProfile={currentProfile}
            subscription={subscription}
          />

          <div className="flex border-b border-[#E8ECF4] mb-6">
            {TABS.map(({ id, label }) => {
              const active = tab === id;
              const count = id === "requests" ? pendingMatches.length : id === "messages" ? unreadCount : 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`px-5 py-2.5 Livvic-SemiBold text-[14px] border-b-2 -mb-px ${
                    active
                      ? "border-[#001243] text-[#001243]"
                      : "border-transparent text-[#9CA3AF] hover:text-[#001243]"
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 ml-1.5 rounded-full text-[10px] font-extrabold ${
                        id === "requests"
                          ? "bg-[#EF4444] text-white"
                          : "bg-[#AEC4FF] text-[#001243]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            ref={listRef}
            onScroll={handleIncomingScroll}
            className="flex-1 min-h-0 overflow-y-auto pb-8"
          >
            {tab === "requests" && (
              <IncomingRequests
                matches={pendingMatches}
                isMatchLoading={isMatchLoading}
                hasMore={hasMore}
                hasFetched={hasFetched}
                onBrowse={() => navigate("/dashboard")}
              />
            )}
            {tab === "messages" &&
              (activeConversations.length === 0 ? (
                <MatchesEmptyState
                  variant="messages"
                  headline="No conversations yet"
                  description="Once you accept a match request, your conversation will appear here."
                  ctaLabel="View Requests"
                  onCta={() => setTab("requests")}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {activeConversations.map((contact) => (
                    <ConversationRow
                      key={contact._id || contact.otherParticipant?._id}
                      contact={contact}
                      onSelect={handleSelectContact}
                    />
                  ))}
                </div>
              ))}
            {tab === "sent" && (
              <OutgoingRequests onBrowse={() => navigate("/dashboard")} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
