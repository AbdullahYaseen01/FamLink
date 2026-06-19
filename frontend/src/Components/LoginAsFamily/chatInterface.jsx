import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MicIcon, Loader2, ChevronRight, Search,
} from "lucide-react";
import { deleteChatThunk, getChatsThunk } from "../Redux/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import useSocket from "../../Config/socket";
import { useChats } from "../../Config/useChat";
import { timeAgo } from "../subComponents/toCamelStr";
import { useLocation } from "react-router-dom";
import { SwalFireDelete } from "../../swalFire";
import { fireToastMessage } from "../../toastContainer";
import { clearSelectedContact, setSelectedContact } from "../Redux/selectedContactSlice";
import ChatView from "../subComponents/chatView";
import Loader from "../subComponents/loader";
import { useSearchParams, NavLink } from "react-router-dom";
import { getIncomingRequestsThunk } from "../Redux/matchSlice";
import { MatchRequestSuccessModal } from "../../NewComponents/MatchSuccessModal";
import ChatInterfaceRequests from "../../NewComponents/ChatInterfaceRequests";

const isProbablyAudio = (str) =>
  typeof str === "string" && str.length > 200 && /^[A-Za-z0-9+/=]+$/.test(str);

/* ─── Sidebar (desktop only) ─── */
function Sidebar({ pendingMatches, activeConversations }) {
  return (
    <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col gap-4">
      {/* Match Requests card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF8FF] flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38AEE3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="Livvic-Bold text-lg text-gray-900">Match Requests</span>
          <span className="bg-[#38AEE3] text-white text-xs Livvic-SemiBold px-2 py-0.5 rounded-full min-w-[22px] text-center">
            {pendingMatches.length}
          </span>
        </div>
        <p className="Livvic text-sm text-gray-400 mb-4">People who want to connect with you</p>
        <div className="bg-[#EBF8FF] rounded-xl p-4">
          <p className="Livvic-SemiBold text-[#38AEE3] text-sm mb-1">You can also send match requests!</p>
          <p className="Livvic text-gray-500 text-xs leading-relaxed mb-3">
            Browse families and caregivers who might be a great fit and send a request.
          </p>
          <NavLink to="/dashboard">
            <button className=" bg-[#38AEE3] text-white rounded-lg px-3 py-2 text-sm Livvic-SemiBold">
              Find a Match →
            </button>
          </NavLink>
        </div>
      </div>

      {/* Messages card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF8FF] flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38AEE3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="Livvic-Bold text-lg text-gray-900">Messages</span>
          <span className="bg-[#38AEE3] text-white text-xs Livvic-SemiBold px-2 py-0.5 rounded-full min-w-[22px] text-center">
            {activeConversations.length}
          </span>
        </div>
        <p className="Livvic text-sm text-gray-400 mb-4">Your active conversations</p>
        <div className="bg-[#EBF8FF] rounded-xl p-4">
          <p className="Livvic-SemiBold text-[#38AEE3] text-sm mb-1">Accept a request to start chatting!</p>
          <p className="Livvic text-gray-500 text-xs leading-relaxed">
            Once you accept a match request, your conversation will appear here.
          </p>
        </div>
      </div>
    </aside>
  );
}

/* ─── Conversation Row ─── */
function ConversationRow({ contact, selectedContactId, onSelect }) {
  return (
    <div
      className={`flex items-center gap-4 px-6 py-4 cursor-pointer border-b border-gray-50 transition-colors last:border-b-0
        ${selectedContactId === contact?._id ? "bg-[#EBF8FF]" : "bg-white hover:bg-gray-50"}`}
      onClick={() => onSelect(contact)}
    >
      <div className="relative shrink-0">
        {contact?.otherParticipant?.imageUrl ? (
          <img
            src={contact.otherParticipant.imageUrl}
            alt={contact.otherParticipant.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <Avatar
            size="48"
            color="#38AEE3"
            name={contact?.otherParticipant?.name?.split(" ").slice(0, 2).join(" ")}
            className="rounded-full"
          />
        )}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="Livvic-Bold text-base text-gray-900 mb-0.5">{contact?.otherParticipant?.name}</p>
        <p className="Livvic text-sm text-gray-400 truncate">
          {isProbablyAudio(contact?.lastMessage) ? (
            <span className="flex items-center gap-1"><MicIcon size={13} /> Voice message</span>
          ) : (
            `Last message: ${contact?.lastMessage?.split(" ").slice(0, 8).join(" ")}${(contact?.lastMessage?.split(" ").length ?? 0) > 8 ? "..." : ""}`
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="Livvic text-xs text-gray-300">
          {contact?.lastMessage?.length > 0 ? timeAgo(contact.updatedAt) : ""}
        </span>
        <ChevronRight size={16} className="text-gray-300" />
      </div>
    </div>
  );
}

/* ─── Dashboard feed (shown when no chat selected) ─── */
function DashboardFeed({
  pendingMatches,
  activeConversations,
  showRequests,
  setShowRequests,
  isMatchLoading,
  setIsRequestMatchSuccessModal,
  setChatUserId,
  selectedContactId,
  onSelectContact,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeConversations;
    return activeConversations.filter((c) =>
      c?.otherParticipant?.name?.toLowerCase().includes(q)
    );
  }, [searchQuery, activeConversations]);

  return (
    <main className="flex-1 flex flex-col gap-5 min-w-0">

      {/* ── Requests Section ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-start px-6 sm:px-8 pt-6 sm:pt-8 pb-5">
          <div>
            <h2 className="Livvic-Bold text-xl sm:text-2xl text-gray-900 mb-1">
              {pendingMatches.length > 0
                ? `${pendingMatches.length} new match request${pendingMatches.length !== 1 ? "s" : ""}`
                : "Requests"}
            </h2>
            {pendingMatches.length > 0 && (
              <p className="Livvic text-sm text-gray-400">
                Review the families and caregivers who are interested in working with you.
              </p>
            )}
          </div>
          <div className="flex gap-4 shrink-0 ml-4">
            {pendingMatches.length > 0 && (
              <button
                className="text-[#38AEE3] Livvic-SemiBold text-sm hover:underline"
                onClick={() => setShowRequests((p) => !p)}
              >
                {showRequests ? "Hide" : "Show"}
              </button>
            )}
            <NavLink to="/dashboard/requests">
              <button className="text-[#38AEE3] Livvic-SemiBold text-sm hover:underline">View All</button>
            </NavLink>
          </div>
        </div>

        {pendingMatches.length === 0 ? (
          <div className="px-6 sm:px-8 pb-8 sm:pb-10">
            <p className="Livvic-Bold text-2xl sm:text-3xl text-gray-900 mb-2">No match requests yet.</p>
            <p className="Livvic text-base text-gray-400 max-w-xl leading-relaxed">
              Continue exploring and connecting with families and caregivers. New requests will appear here when someone wants to match with you.
            </p>
          </div>
        ) : (
          <>
            {showRequests && (
              <div className="px-6 sm:px-8 pb-4">
                <ChatInterfaceRequests
                  matches={pendingMatches}
                  isMatchLoading={isMatchLoading}
                  setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal}
                  setChatUserId={setChatUserId}
                />
              </div>
            )}
            {pendingMatches.length > 3 && (
              <div className="text-center px-6 sm:px-8 pb-6">
                <NavLink to="/dashboard/requests">
                  <button className="text-[#38AEE3] Livvic-SemiBold text-base hover:underline">View All Requests →</button>
                </NavLink>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Messages Section ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="Livvic-Bold text-xl sm:text-2xl text-gray-900">
              {activeConversations.length > 0
                ? `${activeConversations.length} active conversation${activeConversations.length !== 1 ? "s" : ""}`
                : "Messages"}
            </h2>
          </div>
          {/* Search bar — visible on all screen sizes including mobile */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm Livvic placeholder:text-gray-400 focus:outline-none focus:border-[#38AEE3] bg-gray-50 transition-colors"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Search size={15} />
            </span>
          </div>
        </div>

        {activeConversations.length === 0 ? (
          <div className="px-6 sm:px-8 pb-8 sm:pb-10">
            <p className="Livvic-Bold text-2xl sm:text-3xl text-gray-900 mb-2">No Conversations yet.</p>
            <p className="Livvic text-base text-gray-400 max-w-xl leading-relaxed">
              Once a match request is accepted, your conversation will appear here.
            </p>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="border-t border-gray-50">
            {filteredConversations.map((contact) => (
              <ConversationRow
                key={contact._id}
                contact={contact}
                selectedContactId={selectedContactId}
                onSelect={onSelectContact}
              />
            ))}
          </div>
        ) : (
          <div className="px-6 sm:px-8 pb-8 text-center Livvic text-base text-gray-300">
            No conversations match your search.
          </div>
        )}
      </section>

    </main>
  );
}

/* ─── Split chat panel (shown when a contact is selected) ─── */
function ChatPanel({ activeConversations, selectedContact, selectedContactId, onSelectContact, onBack, isLoading, messages, handleSendMessage, user, pathname, handleCloseChat }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeConversations;
    return activeConversations.filter((c) =>
      c?.otherParticipant?.name?.toLowerCase().includes(q)
    );
  }, [searchQuery, activeConversations]);

  return (
    <div
      className="flex-1 flex min-w-0 w-full border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
      style={{ height: "calc(100vh - 100px)" }}
    >
      {/* Contact list column */}
      <div className={`w-full sm:w-80 shrink-0 border-r border-gray-100 flex flex-col
        ${selectedContact ? "hidden sm:flex" : "flex"}`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <button
              className="p-1 shrink-0 text-gray-500 hover:text-gray-800"
              onClick={onBack}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="Livvic-Bold text-xl text-gray-900">Conversations</h2>
            <span className="bg-[#38AEE3] text-white text-xs Livvic-SemiBold px-2 py-0.5 rounded-full min-w-[22px] text-center">
              {activeConversations.length}
            </span>
          </div>
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Contacts"
              className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm Livvic placeholder:text-gray-400 focus:outline-none focus:border-[#38AEE3] bg-gray-50"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Search size={14} />
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((contact) => (
              <ConversationRow
                key={contact._id}
                contact={contact}
                selectedContactId={selectedContactId}
                onSelect={onSelectContact}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full Livvic text-base text-gray-300 p-6 text-center">
              {searchQuery ? "No contacts match your search." : "No active conversations yet."}
            </div>
          )}
        </div>
      </div>

      {/* Chat view column */}
      <div className={`flex-1 w-full min-w-0 flex flex-col
        ${selectedContact ? "flex" : "hidden sm:flex"}`}>
        {selectedContact ? (
          isLoading ? (
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
              onBack={onBack}
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center Livvic text-base text-gray-300">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page component ─── */
export default function Component() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("chatId");
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const [isRequestMatchSuccessModal, setIsRequestMatchSuccessModal] = useState(false);
  const [chatUserId, setChatUserId] = useState(null);
  const { incomingMatches, isMatchLoading } = useSelector((state) => state.matchRequest);
  const [showRequests, setShowRequests] = useState(incomingMatches.length > 0);
  const { pathname } = useLocation();
  const selectedContact = useSelector((state) => state.selectedContact.selectedContact);
  const { chatList, handleSendMessage, messages, handleCloseChat, isLoading } = useChats({
    chatId: selectedContact?._id,
    data: selectedContact,
  });
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(getIncomingRequestsThunk({ page: 1, limit: 3, status: "pending" }));
  }, [dispatch]);

  useEffect(() => {
    if (chatId && chatList.length > 0) {
      const chat = chatList.find((c) => c.otherParticipant?._id === chatId);
      if (chat) dispatch(setSelectedContact(chat));
    }
  }, [chatId, chatList, dispatch]);

  useEffect(() => {
    dispatch(getChatsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (selectedContact?._id) {
      socket?.emit("leaveChat", { chatId: selectedContact._id });
    }
  }, [selectedContact?._id, socket]);

  const pendingMatches = useMemo(
    () => incomingMatches?.filter((m) => m.status === "pending") ?? [],
    [incomingMatches]
  );

  const activeConversations = useMemo(
    () => chatList.filter((c) => c?.otherParticipant?.name !== "Admin"),
    [chatList]
  );

  const handleSelectContact = useCallback((contact) => {
    dispatch(setSelectedContact(contact));
  }, [dispatch]);

  const handleBack = useCallback(() => {
    dispatch(clearSelectedContact());
  }, [dispatch]);

  const clearChat = useCallback((id) => {
    const handleDelete = async () => {
      try {
        const { status, data } = await dispatch(deleteChatThunk(id)).unwrap();
        if (status === 200) {
          await dispatch(getChatsThunk()).unwrap();
          dispatch(clearSelectedContact());
          fireToastMessage({ type: "success", message: data.message });
        }
      } catch (err) {
        fireToastMessage({ type: "error", message: err });
      }
    };
    SwalFireDelete({ title: "Are you sure for clear this chat", handleDelete });
  }, [dispatch]);

  return (
    <div className="min-h-screen">
      {isRequestMatchSuccessModal && (
        <MatchRequestSuccessModal
          setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal}
          chatUserId={chatUserId}
        />
      )}
      {isMatchLoading && <Loader />}

      <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-6 px-4 sm:px-6 xl:px-8 py-8 sm:py-10 items-start">
        <Sidebar pendingMatches={pendingMatches} activeConversations={activeConversations} />

        {selectedContact ? (
          <ChatPanel
            activeConversations={activeConversations}
            selectedContact={selectedContact}
            selectedContactId={selectedContact?._id}
            onSelectContact={handleSelectContact}
            onBack={handleBack}
            isLoading={isLoading}
            messages={messages}
            handleSendMessage={handleSendMessage}
            user={user}
            pathname={pathname}
            handleCloseChat={handleCloseChat}
          />
        ) : (
          <DashboardFeed
            pendingMatches={pendingMatches}
            activeConversations={activeConversations}
            showRequests={showRequests}
            setShowRequests={setShowRequests}
            isMatchLoading={isMatchLoading}
            setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal}
            setChatUserId={setChatUserId}
            selectedContactId={selectedContact?._id}
            onSelectContact={handleSelectContact}
          />
        )}
      </div>
    </div>
  );
}
