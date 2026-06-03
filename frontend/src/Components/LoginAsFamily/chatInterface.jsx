import { useEffect, useState } from "react";
import { Star, MoreVertical, SearchIcon, MicIcon, Loader2 } from "lucide-react";
import { deleteChatThunk, getChatsThunk } from "../Redux/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import useSocket from "../../Config/socket";
import { useChats } from "../../Config/useChat";
import { timeAgo } from "../subComponents/toCamelStr";
import { useLocation, useNavigate } from "react-router-dom";
import { SwalFireDelete } from "../../swalFire";
import { fireToastMessage } from "../../toastContainer";
import {
  clearSelectedContact,
  setSelectedContact,
} from "../Redux/selectedContactSlice"; // Import the new component
import ChatView from "../subComponents/chatView";
import ChatInterfaceRequests from "../../NewComponents/ChatInterfaceRequests";
import Loader from "../subComponents/loader";
import { useSearchParams, NavLink } from "react-router-dom";
import { getIncomingRequestsThunk } from "../Redux/matchSlice";
import { MatchRequestSuccessModal } from "../../NewComponents/MatchSuccessModal";

const isProbablyAudio = (str) =>
  typeof str === "string" && str.length > 200 && /^[A-Za-z0-9+/=]+$/.test(str);

export default function Component() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("chatId");
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const [isRequestMatchSuccessModal, setIsRequestMatchSuccessModal] = useState(false)
  const [chatUserId, setChatUserId] = useState(null)
  const { matches, isMatchLoading } = useSelector(
    (state) => state.matchRequest
  );

  const filteredMatches = matches
    ?.filter(
      (profile) =>
        profile.status !== "accepted" &&
        profile.status !== "rejected"
    )
  const { pathname } = useLocation();
  const selectedContact = useSelector(
    (state) => state.selectedContact.selectedContact
  );
  const { chatList, handleSendMessage, messages, handleCloseChat, isLoading } =
    useChats({
      chatId: selectedContact?._id,
      data: selectedContact,
    });
  const { user } = useSelector((s) => s.auth);
  const navlink = useNavigate();
  const nannyShare = pathname.split("/")[1] == "family" && "Parents";

  useEffect(() => {
    dispatch(getIncomingRequestsThunk({ page: 1, limit: 2, status: "pending" }));
  }, [dispatch]);

  useEffect(() => {
    if (chatId && chatList.length > 0) {
      const chat = chatList.find(
        (c) => c.otherParticipant?._id === chatId
      );
      if (chat) {
        dispatch(setSelectedContact(chat));
      }
    }
  }, [chatId, chatList, dispatch]);

  useEffect(() => {
    const handleData = async () => {
      const { data, status } = await dispatch(getChatsThunk()).unwrap();
    };
    handleData();
  }, []);

  useEffect(() => {
    socket?.emit("leaveChat", { chatId: selectedContact?._id });
    handleCloseChat();
  }, [selectedContact?._id, socket]);

  const filteredContacts = chatList.filter((c) =>
    c?.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearChat = (chatId) => {
    const handleDelete = async () => {
      try {
        const { status, data } = await dispatch(
          deleteChatThunk(chatId)
        ).unwrap();

        if (status == 200) {
          await dispatch(getChatsThunk()).unwrap();
          dispatch(clearSelectedContact());
          fireToastMessage({ type: "success", message: data.message });
        }
      } catch (err) {
        fireToastMessage({ type: "error", message: err });
      }
    };

    SwalFireDelete({ title: "Are you sure for clear this chat", handleDelete });
  };

  const ContactList = () => (
    <div className="flex bg-white flex-col">
      <div
        style={{ overflowY: "auto", height: "100%" }}
        className="flex-1 mt-6"
      >
        {filteredContacts
          ?.filter((contact) => contact?.otherParticipant?.name != "Admin")
          .map((contact) => (
            <div
              key={contact?._id}
              className={`flex items-center hover:bg-accent p-4 cursor-pointer ${selectedContact?._id === contact?._id && "bg-[#F6F3EE]"
                }`}
              onClick={() => dispatch(setSelectedContact(contact))}
            >
              <div className="rounded-2xl w-12 h-12">
                {contact?.otherParticipant?.imageUrl ? (
                  <img
                    style={{ backgroundColor: "#38AEE3" }}
                    className="rounded-full w-12 h-12 object-cover"
                    src={contact?.otherParticipant?.imageUrl}
                    alt={contact?.otherParticipant?.name}
                  />
                ) : (
                  <Avatar
                    className="rounded-full object-cover"
                    size="50"
                    color="#38AEE3"
                    name={contact?.otherParticipant?.name
                      ?.split(" ")
                      .slice(0, 2)
                      .join(" ")}
                  />
                )}
              </div>
              <div className="flex-1 ml-4">
                <div className="flex justify-between items-center font-black">
                  {contact?.otherParticipant?.name}
                  <div className="flex gap-2 items-center">
                    <div
                      style={{ color: "#777777" }}
                      className="flex items-center gap-1 text-muted-foreground text-sm font-light"
                    >
                      {contact?.lastMessage?.length > 0 && (
                        <>{timeAgo(contact.updatedAt)}</>
                      )}
                    </div>
                    {nannyShare != contact?.otherParticipant?.type &&
                      pathname.split("/")[1] != "nanny" && (
                        <Star
                          fill={
                            user.favourite?.includes(
                              contact?.otherParticipant?._id
                            )
                              ? `#38AEE3`
                              : "white"
                          }
                          color="#38AEE3"
                          className="w-4"
                        />
                      )}
                  </div>
                </div>
                <div
                  style={{ color: "#777777" }}
                  className="my-2 Livvic-Medium leading-4"
                >
                  {isProbablyAudio(contact?.lastMessage) ? (
                    <div className="flex gap-2">
                      {/* <img src={play} alt="play" />
                    <img className="w-44" src={Record} alt="Record" /> */}
                      <MicIcon size={16} />
                    </div>
                  ) : contact?.lastMessage?.split(" ").length > 20 ? (
                    contact?.lastMessage?.split(" ").slice(0, 20).join(" ") +
                    "..."
                  ) : (
                    contact?.lastMessage
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div>
      {isRequestMatchSuccessModal && <MatchRequestSuccessModal setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal} chatUserId={chatUserId} />}
      {isMatchLoading && <Loader />}
      {filteredMatches.length > 0 && <div className="padding-navbar1 !py-12">
        <div className="flex justify-between items-center mb-4 px-2 sm:px-0">
          <div>
            <div className="flex gap-2 items-center">
              <h1 className="Livvic-SemiBold text-3xl mb-1">Requests</h1>
              <div className="bg-purple-500 py-1 px-2 rounded-lg Livvic-Medium text-base text-white">{matches.filter((match) => match.status === "pending").length}</div>
            </div>
            <p className="Livvic-Medium text-gray-400">People who want to connect with you</p>
          </div>
          <NavLink
            to="/dashboard/requests"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            <div className="Livvic-SemiBold text-base">View All</div>
          </NavLink>
        </div>
        <div className=" max-w-7xl mx-auto">
          <ChatInterfaceRequests matches={matches} isMatchLoading={isMatchLoading} setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal} setChatUserId={setChatUserId} />
        </div>
      </div>}
      {chatList.filter((c) => c.otherParticipant?.type !== "Admin").length > 0 ? (<div className="padding-navbar1 flex bg-background shadow-2xl h-[calc(100vh-80px)] overflow-hidden">
        <div
          className={`w-full md:w-1/3 -px-4 sm:px-0 border-r ${selectedContact ? "hidden md:block" : "block"
            }`}
        >
          <div className="flex bg-white justify-between items-center px-4 py-6">
            <div>
              <div className="flex bg-white gap-2 items-center mb-1">
                <h1 className="Livvic-SemiBold text-3xl">Conversations</h1>
                <div className="bg-purple-500 py-1 px-2 rounded-lg Livvic-Medium text-base text-white">{filteredContacts
                  ?.filter((contact) => contact?.otherParticipant?.name != "Admin").length}</div>
              </div>
              <p className="Livvic-Medium text-gray-400">Accept Match request to chat.</p>
            </div>
          </div>
          <div>

          </div>
          <div className="px-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Contacts"
              className="w-full pl-10 pr-4 py-2 rounded-full border border-[#EEEEEE] placeholder:text-sm"
            />
            <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
          </div>
          <ContactList />
        </div>

        {/* Desktop Chat View */}
        <div className="md:block hidden w-2/3">
          {selectedContact ? (
            <div className="min-w-full w-full h-full flex justify-center items-center">
              {isLoading ? (
                <div className="flex gap-2 items-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p>Loading</p>
                </div>
              ) : (
                <ChatView
                  messages={messages}
                  handleSendMessage={handleSendMessage}
                  selectedContact={selectedContact}
                  user={user}
                  pathname={pathname}
                  handleCloseChat={handleCloseChat}
                />
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              Select a contact to start chatting
            </div>
          )}
        </div>

        {/* Mobile Chat View */}
        {selectedContact && (
          <div className="w-full md:hidden h-full flex justify-center items-center">
            {isLoading ? (
              <div className="flex gap-2 items-center">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p>Loading</p>
              </div>
            ) : (
              <ChatView
                messages={messages}
                handleSendMessage={handleSendMessage}
                selectedContact={selectedContact}
                user={user}
                pathname={pathname}
                handleCloseChat={handleCloseChat}
              />
            )}
          </div>
        )}
      </div>) : (
        <div className="padding-navbar1 !pb-6  h-[calc(100vh-500px)] mt-12">
          <div className="flex bg-white gap-2 items-center mb-1">
            <h1 className="Livvic-SemiBold text-3xl">Conversations</h1>
            <div className="bg-purple-500 py-1 px-2 rounded-lg Livvic-Medium text-base text-white">0</div>
          </div>
          <p className="Livvic-Medium text-gray-400">Accept Match request to chat</p>
          <div className="flex justify-center items-center w-full h-full">
            No active conversations
          </div>
        </div>
      )}
    </div>
  );
}
