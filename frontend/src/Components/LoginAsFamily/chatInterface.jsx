import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MicIcon, Loader2, ChevronRight,
  Rocket, Search, ClipboardList, Bell,
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

/* ─── Sidebar ─── */
function Sidebar({ pendingMatches, activeConversations }) {
  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-5">
      {/* Match Requests card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#EEF3FF" />
            <path d="M10 14h28v18a3 3 0 01-3 3H13a3 3 0 01-3-3V14z" stroke="#2563EB" strokeWidth="1.8" fill="none" />
            <path d="M10 14l14 12 14-12" stroke="#2563EB" strokeWidth="1.8" fill="none" />
            <circle cx="36" cy="15" r="7" fill="#2563EB" />
            <text x="36" y="19" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
              {pendingMatches.length}
            </text>
          </svg>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="Livvic-Bold text-xl text-gray-900">Match Requests</span>
          <span className="bg-purple-600 text-white text-sm Livvic-SemiBold px-2.5 py-0.5 rounded-lg">
            {pendingMatches.length}
          </span>
        </div>
        <p className="Livvic text-base text-gray-400">People who want to connect with you</p>
      </div>

      {/* Tip: send requests */}
      <div className="bg-blue-50 rounded-2xl p-5 flex gap-3 items-start">
        <div className="text-blue-600 mt-0.5 shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <div>
          <p className="Livvic-SemiBold text-blue-600 text-base mb-1">You can also send match requests!</p>
          <p className="Livvic text-gray-500 text-sm leading-relaxed mb-4">
            Browse families and caregivers who might be a great fit and send a request.
          </p>
          <NavLink to="/dashboard">
            <button className="border border-blue-600 text-blue-600 bg-white rounded-xl px-4 py-2 text-sm Livvic-SemiBold hover:bg-blue-50 transition-colors">
              Find a Match →
            </button>
          </NavLink>
        </div>
      </div>

      {/* Messages card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#EEF3FF" />
            <path d="M10 14h28v16a3 3 0 01-3 3H13a3 3 0 01-3-3V14z" stroke="#2563EB" strokeWidth="1.8" fill="none" />
            <circle cx="19" cy="22" r="2" fill="#2563EB" />
            <circle cx="24" cy="22" r="2" fill="#2563EB" />
            <circle cx="29" cy="22" r="2" fill="#2563EB" />
          </svg>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="Livvic-Bold text-xl text-gray-900">Messages</span>
          <span className="bg-purple-600 text-white text-sm Livvic-SemiBold px-2.5 py-0.5 rounded-lg">
            {activeConversations.length}
          </span>
        </div>
        <p className="Livvic text-base text-gray-400">Your active conversations</p>
      </div>

      {/* Tip: accept to chat */}
      <div className="bg-blue-50 rounded-2xl p-5 flex gap-3 items-start">
        <div className="text-blue-600 mt-0.5 shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <div>
          <p className="Livvic-SemiBold text-blue-600 text-base mb-1">Accept a request to start chatting!</p>
          <p className="Livvic text-gray-500 text-sm leading-relaxed">
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
      className={`flex items-center gap-4 px-5 py-4 cursor-pointer border-b border-gray-50 transition-colors last:border-b-0
        ${selectedContactId === contact?._id ? "bg-blue-50" : "bg-white hover:bg-gray-50"}`}
      onClick={() => onSelect(contact)}
    >
      <div className="relative shrink-0">
        {contact?.otherParticipant?.imageUrl ? (
          <img src={contact.otherParticipant.imageUrl} alt={contact.otherParticipant.name}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover" />
        ) : (
          <Avatar size="56" color="#38AEE3"
            name={contact?.otherParticipant?.name?.split(" ").slice(0, 2).join(" ")}
            className="rounded-full" />
        )}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="Livvic-Bold text-base text-gray-900 mb-0.5">{contact?.otherParticipant?.name}</p>
        <p className="Livvic text-sm text-gray-400 truncate">
          {isProbablyAudio(contact?.lastMessage)
            ? <span className="flex items-center gap-1"><MicIcon size={13} /> Voice message</span>
            : `Last message: ${contact?.lastMessage?.split(" ").slice(0, 8).join(" ")}${(contact?.lastMessage?.split(" ").length ?? 0) > 8 ? "..." : ""}`
          }
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="Livvic text-sm text-gray-300">
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
  return (
    <main className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto">
      {/* Match Requests Section */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="Livvic-Bold text-2xl sm:text-3xl text-gray-900 mb-1">
              {pendingMatches.length} new match requests
            </h2>
            <p className="Livvic text-base text-gray-400">
              Review the families and caregivers who are interested in working with you.
            </p>
          </div>
          <div className="flex gap-5 shrink-0 ml-4">
            <button
              className="text-blue-600 Livvic-SemiBold text-base hover:underline"
              onClick={() => setShowRequests((p) => !p)}
            >
              {showRequests ? "Hide" : "Show"}
            </button>
            <NavLink to="/dashboard/requests">
              <button className="text-blue-600 Livvic-SemiBold text-base hover:underline">View All</button>
            </NavLink>
          </div>
        </div>

        {showRequests && (
          <ChatInterfaceRequests
            matches={pendingMatches}
            isMatchLoading={isMatchLoading}
            setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal}
            setChatUserId={setChatUserId}
          />
        )}

        {pendingMatches.length > 3 && (
          <div className="text-center mt-6">
            <NavLink to="/dashboard/requests">
              <button className="text-blue-600 Livvic-SemiBold text-base hover:underline">View All Requests →</button>
            </NavLink>
          </div>
        )}
      </section>

      {/* Conversations Section */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="Livvic-Bold text-2xl sm:text-3xl text-gray-900 mb-1">
              {activeConversations.length} active conversations
            </h2>
            <p className="Livvic text-base text-gray-400">
              Continue your conversations with matched families and caregivers.
            </p>
          </div>
          {/* <NavLink to="/dashboard/messages" className="shrink-0 ml-4">
            <button className="text-blue-600 Livvic-SemiBold text-base hover:underline">View All</button>
          </NavLink> */}
        </div>

        {activeConversations.length > 0 ? (
          <div className="rounded-2xl overflow-auto h-[400px] border border-gray-100">
            {activeConversations.map((contact) => (
              <ConversationRow
                key={contact._id}
                contact={contact}
                selectedContactId={selectedContactId}
                onSelect={onSelectContact}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center Livvic text-base text-gray-300">No active conversations yet.</div>
        )}
      </section>

      {/* CTA Banner */}
      {/* <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row flex-wrap gap-6 items-start sm:items-center">
          <div className="flex items-start gap-4 shrink-0 sm:max-w-[220px]">
            <div className="bg-blue-600 rounded-xl p-3 shrink-0">
              <Rocket size={22} className="text-white" />
            </div>
            <div>
              <p className="Livvic-Bold text-base text-gray-900 mb-1">Take action to find your perfect match</p>
              <p className="Livvic text-sm text-gray-400 leading-relaxed">
                The more active you are, the better your chances of finding the right family or caregiver.
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap gap-5 items-center">
            {[
              { icon: <Search size={18} className="text-blue-600" />, title: "Browse & send requests", sub: "Explore families and caregivers and send match requests." },
              { icon: <ClipboardList size={18} className="text-blue-600" />, title: "Complete your profile", sub: "Add details to help others learn about you and match with you." },
              { icon: <Bell size={18} className="text-blue-600" />, title: "Stay active", sub: "Check back often—new requests can come in!" },
            ].map(({ icon, title, sub }, i) => (
              <div key={i} className="flex items-start gap-3 min-w-[140px] flex-1">
                <div className="bg-blue-50 rounded-xl p-2.5 shrink-0">{icon}</div>
                <div>
                  <p className="Livvic-SemiBold text-sm text-gray-900 mb-0.5">{title}</p>
                  <p className="Livvic text-sm text-gray-400 leading-relaxed">{sub}</p>
                </div>
              </div>
            ))}
            <NavLink to="/dashboard" className="shrink-0 sm:ml-auto">
              <button className="bg-blue-600 hover:bg-blue-700 text-white Livvic-Bold text-base px-6 py-3.5 rounded-xl transition-colors whitespace-nowrap">
                Find a Match →
              </button>
            </NavLink>
          </div>
        </div>
      </div> */}
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
    <div className="flex-1 flex min-w-0 w-full border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
      style={{ height: "calc(100vh - 100px)" }}>
      {/* Contact list column */}
      <div className={`w-full sm:w-80 shrink-0 border-r border-gray-100 flex flex-col
        ${selectedContact ? "hidden sm:flex" : "flex"}`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <button
              className="p-1 mr-1 shrink-0 text-gray-500 hover:text-gray-800"
              onClick={onBack}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="Livvic-Bold text-xl text-gray-900">Conversations</h2>
            <span className="bg-purple-600 text-white text-sm Livvic-SemiBold px-2.5 py-0.5 rounded-lg">
              {activeConversations.length}
            </span>
          </div>
          <p className="Livvic text-sm text-gray-400 mb-3">Chat with your matches.</p>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Contacts"
              className="w-full pl-9 pr-4 py-2 rounded-full border border-[#EEEEEE] text-sm Livvic placeholder:text-gray-400 focus:outline-none focus:border-blue-300"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
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
  const [showRequests, setShowRequests] = useState(true);
  const { incomingMatches, isMatchLoading } = useSelector((state) => state.matchRequest);
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
    <div className="min-h-screen bg-white">
      {isRequestMatchSuccessModal && (
        <MatchRequestSuccessModal
          setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal}
          chatUserId={chatUserId}
        />
      )}
      {isMatchLoading && <Loader />}

      <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-6 px-4 sm:px-6 xl:px-8 py-8 sm:py-10 items-start">
        {/* LEFT SIDEBAR — always visible */}
        <Sidebar pendingMatches={pendingMatches} activeConversations={activeConversations} />

        {/* MAIN AREA — dashboard feed OR chat split panel */}
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