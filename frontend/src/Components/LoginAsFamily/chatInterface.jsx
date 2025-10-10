import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Search,
  Star,
  Clock,
  MoreVertical,
  SearchIcon,
  MicIcon,
} from "lucide-react";
import { Button, Input, Menu } from "antd";
import s1 from "../../assets/images/s1.png";
import play from "../../assets/images/play.png";
import Record from "../../assets/images/Record.png";
import { deleteChatThunk, getChatsThunk } from "../Redux/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import useSocket from "../../Config/socket";
import { useChats } from "../../Config/useChat";
import { formatTime, timeAgo } from "../subComponents/toCamelStr";
import { useLocation, useNavigate } from "react-router-dom";
import { SwalFireDelete } from "../../swalFire";
import { fireToastMessage } from "../../toastContainer";
import {
  clearSelectedContact,
  setSelectedContact,
} from "../Redux/selectedContactSlice"; // Import the new component
import ChatView from "../subComponents/chatView";

const isProbablyAudio = (str) =>
  typeof str === "string" && str.length > 200 && /^[A-Za-z0-9+/=]+$/.test(str);

export default function Component() {
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { pathname } = useLocation();
  const selectedContact = useSelector(
    (state) => state.selectedContact.selectedContact
  );
  const { chatList, handleSendMessage, messages } = useChats({
    chatId: selectedContact?._id,
    data: selectedContact,
  });
  const { user } = useSelector((s) => s.auth);
  const navlink = useNavigate();
  const nannyShare = pathname.split("/")[1] == "family" && "Parents";

  useEffect(() => {
    const handleData = async () => {
      const { data, status } = await dispatch(getChatsThunk()).unwrap();
    };
    handleData();
  }, []);

  useEffect(() => {
    socket?.emit("leaveChat", { chatId: selectedContact?._id });
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
        {filteredContacts?.filter((contact) => contact?.otherParticipant?.name != "Admin").map((contact) => (
          <div
            key={contact?._id}
            className={`flex items-center hover:bg-accent p-4 cursor-pointer ${
              selectedContact?._id === contact?._id && "bg-[#F6F3EE]"
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
              <div className="flex justify-between items-center font-black Quicksand">
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
    <div className="flex bg-background shadow-2xl h-[calc(100vh-80px)] overflow-hidden">
      <div
        className={`w-full md:w-1/3 border-r ${
          selectedContact ? "hidden md:block" : "block"
        }`}
      >
        <div className="flex bg-white justify-between items-center px-4 py-6">
          <h1 className="font-semibold text-3xl">Messages</h1>
          <div className="h-10 w-10 p-2 flex items-center justify-center bg-[#F5F5F5] rounded-full">
            <MoreVertical />
          </div>
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
      <div className="md:block hidden w-2/3">
        {selectedContact ? (
          <div className="min-w-full w-full">
            <ChatView
              messages={messages}
              handleSendMessage={handleSendMessage}
              selectedContact={selectedContact}
              user={user}
              pathname={pathname}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            Select a contact to start chatting
          </div>
        )}
      </div>
      {selectedContact && (
        <div className="w-full reponsive">
          <ChatView
            messages={messages}
            handleSendMessage={handleSendMessage}
            selectedContact={selectedContact}
            user={user}
            pathname={pathname}
          />
        </div>
      )}
    </div>
  );
}
