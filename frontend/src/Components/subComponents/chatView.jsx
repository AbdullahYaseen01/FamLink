import {
  Laugh,
  Star,
  MoreVertical,
  Mic,
  Send,
  ArrowLeft,
  Square,
  X,
} from "lucide-react";
import { Suspense, lazy, memo } from "react";
import { Dropdown, Button, Input, Menu } from "antd";
import line from "../../assets/images/l1.png";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { useNavigate } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clearSelectedContact } from "../Redux/selectedContactSlice";
import { addOrRemoveFavouriteThunk } from "../Redux/favouriteSlice";
import { refreshTokenThunk } from "../Redux/authSlice";
import { formatTime } from "./toCamelStr";
import { getSubscriptionStatusThunk } from "../Redux/cardSlice";
import CustomButton from "../../NewComponents/Button";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

const ChatView = memo(function ChatView({
  messages,
  handleSendMessage,
  selectedContact,
  user,
  pathname,
  handleCloseChat,
}) {
  const dispatch = useDispatch();
  const navlink = useNavigate();
  const navigate = useNavigate();
  const messageWindowRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [inputValue, setInputValue] = useState("");

  const subscription = useSelector((state) => state.cardData.subscriptionStatus);
  const isSubscribed = subscription?.active;

  useEffect(() => { dispatch(getSubscriptionStatusThunk()); }, [dispatch]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isInitialLoad = useRef(true);

  useLayoutEffect(() => {
    const el = messageWindowRef.current;
    if (!el) return;

    if (isInitialLoad.current) {
      el.scrollTop = el.scrollHeight;
      isInitialLoad.current = false;
      return;
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const nannyShare = pathname.split("/")[1] === "family" && "Parents";

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        const base64Audio = await blobToBase64(audioBlob);
        handleSendMessage({
          chatId: selectedContact?._id,
          content: base64Audio,
          senderId: user?._id,
          receiverId: selectedContact?.otherParticipant._id,
          type: "Audio",
        });
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) { mediaRecorder.current.stop(); setIsRecording(false); }
  };

  const cancelRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      audioChunks.current = [];
    }
  };

  const viewProfile = (id, type) => {
    if (type === "Nanny") navlink(`/family/profileNanny/${id}`);
    else if (type === "Parents" && user.type === "Parents") navlink(`/family/profileFamily/${id}`);
    else navlink(`/nanny/profileFamily/${id}`);
  };

  const handleFavourite = async (id) => {
    await dispatch(addOrRemoveFavouriteThunk({ favouriteUserId: id }));
    await dispatch(refreshTokenThunk());
  };

  const formatTime1 = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const menu = (id, type) => (
    <Menu>
      <Menu.Item onClick={() => viewProfile(id, type)} key="1">View Profile</Menu.Item>
    </Menu>
  );

  const sendTextMessage = async () => {
    const messageText = inputValue.trim();
    if (!messageText) return;
    setInputValue("");
    try {
      await handleSendMessage({
        chatId: selectedContact?._id,
        content: messageText,
        senderId: user?._id,
        receiverId: selectedContact?.otherParticipant?._id,
        type: "Text",
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputValue(messageText);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative">

      {/* ── Header ── */}
      <div className="flex justify-between items-center px-4 sm:px-5 border-b border-gray-100 h-16 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back arrow — mobile only */}
          <button
            className="sm:hidden p-1 shrink-0"
            onClick={() => { handleCloseChat(); dispatch(clearSelectedContact()); }}
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          {/* Avatar */}
          <div className="shrink-0">
            {selectedContact?.otherParticipant?.imageUrl ? (
              <img
                src={selectedContact.otherParticipant.imageUrl}
                alt={selectedContact.otherParticipant.name}
                className="w-10 h-10 rounded-full object-cover"
                style={{ backgroundColor: "#38AEE3" }}
              />
            ) : (
              <Avatar
                size="40"
                color="#38AEE3"
                name={selectedContact?.otherParticipant?.name?.split(" ").slice(0, 2).join(" ")}
                className="rounded-full"
              />
            )}
          </div>

          {/* Name */}
          <span className="Livvic-SemiBold text-base sm:text-lg text-gray-900 truncate">
            {selectedContact?.otherParticipant?.name}
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {nannyShare !== selectedContact?.otherParticipant?.type &&
            pathname.split("/")[1] !== "nanny" && (
              <button
                className="p-1.5"
                onClick={() => handleFavourite(selectedContact?.otherParticipant?._id)}
              >
                <Star
                  size={20}
                  fill={user.favourite?.includes(selectedContact?.otherParticipant?._id) ? "#38AEE3" : "white"}
                  color="#38AEE3"
                  className="cursor-pointer"
                />
              </button>
            )}
          {pathname.split("/")[1] === "nanny" && (
            <button className="p-2 rounded-full hover:bg-gray-50">
              <MoreVertical size={20} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* ── Messages area ── */}
      <div
        ref={messageWindowRef}
        className="flex-1 min-h-[300px] overflow-y-auto px-4 sm:px-5 py-4 space-y-1"
      >
        {messages.map((message, index) => {
          const isMine = message?.sender?._id === user?._id;
          return (
            <div key={index} className={`flex ${isMine ? "justify-end" : "justify-start"} py-1`}>
              {message.type === "Audio" ? (
                <div className={isMine ? "sender-audio-player" : "receviver-audio-player"}>
                  <audio controls controlsList="nodownload">
                    <source src={`data:audio/mp3;base64,${message.content}`} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div
                  className="max-w-[75%] sm:max-w-xs lg:max-w-sm xl:max-w-md rounded-2xl px-4 py-3 break-words"
                  style={{ backgroundColor: "#F5F5F5", color: "#555555" }}
                >
                  <p style={{ color: "#AFB8CF" }} className="Livvic text-xs mb-1">
                    {formatTime(message.updatedAt)}
                  </p>
                  <p className="Livvic text-sm sm:text-base leading-relaxed">{message.content}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-gray-100 px-4 sm:px-5 h-[70px] shrink-0 flex items-center gap-3 relative bg-white">
        {/* Emoji button */}
        <button
          className="shrink-0"
          onClick={() => setShowEmojiPicker((p) => !p)}
        >
          <Laugh size={24} fill="#38AEE3" color="white" className="cursor-pointer" />
        </button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute left-4 bottom-[74px] z-[3000] shadow-xl rounded-2xl overflow-hidden"
          >
            <Suspense fallback={<div className="p-4 Livvic text-sm text-gray-400">Loading…</div>}>
              <EmojiPicker
                searchDisabled
                onEmojiClick={(emoji) => setInputValue((prev) => prev + emoji.emoji)}
              />
            </Suspense>
          </div>
        )}

        {isRecording ? (
          /* Recording indicator */
          <div
            className="flex flex-1 items-center gap-3 px-4 py-2 rounded-xl"
            style={{ background: "#DCE6FF" }}
          >
            <div className="wave-container">
              <div className="wave" /><div className="wave" /><div className="wave" />
            </div>
            <span className="Livvic-Medium text-sm" style={{ color: "#38AEE3" }}>
              Recording… {formatTime1(recordingTime)}
            </span>
          </div>
        ) : (
          /* Text input */
          <div className="flex flex-1 items-center">
            <Input
              type="text"
              placeholder="Type a message..."
              style={{ border: "none", boxShadow: "none", width: "100%", fontFamily: "Livvic-Medium", fontSize: 15 }}
              prefix={<img className="object-contain" src={line} alt="" />}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={(e) => { e.preventDefault(); sendTextMessage(); }}
            />
            <Button
              style={{ border: "none", boxShadow: "none" }}
              onClick={sendTextMessage}
            >
              <Send size={20} color="#38AEE3" className="cursor-pointer" />
            </Button>
          </div>
        )}

        {/* Mic / stop / cancel */}
        {isRecording ? (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={cancelRecording} className="text-red-400 hover:text-red-500">
              <X size={20} />
            </button>
            <button onClick={stopRecording} style={{ color: "#38AEE3" }}>
              <Square size={20} />
            </button>
          </div>
        ) : (
          <button onClick={startRecording} style={{ color: "#38AEE3" }} className="shrink-0">
            <Mic size={22} />
          </button>
        )}
      </div>
    </div>
  );
});

export default ChatView;