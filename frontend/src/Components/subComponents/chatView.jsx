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
import { Dropdown, Button, Input, Menu, Form } from "antd";
import line from "../../assets/images/l1.png";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clearSelectedContact } from "../Redux/selectedContactSlice";
import { addOrRemoveFavouriteThunk } from "../Redux/favouriteSlice";
import { refreshTokenThunk } from "../Redux/authSlice";
import { formatTime } from "./toCamelStr";
import { useChats } from "../../Config/useChat";
import { getSubscriptionStatusThunk } from "../Redux/cardSlice";
import CustomButton from "../../NewComponents/Button";

export default function ChatView({
  messages,
  handleSendMessage,
  selectedContact,
  user,
  pathname,
}) {
  const dispatch = useDispatch();
  const navlink = useNavigate();
  const messageWindowRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [chunks, setChunks] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);
  const [form] = Form.useForm();
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();

  const subscription = useSelector(
    (state) => state.cardData.subscriptionStatus
  );
  const isSubscribed = subscription?.active;

  // 🔁 Fetch subscription status on component mount
  useEffect(() => {
    dispatch(getSubscriptionStatusThunk());
  }, [dispatch]);
  //   const { chatList, messages } = useChats({
  //     chatId: selectedContact?._id,
  //     data: selectedContact,
  //   });

  const nannyShare = pathname.split("/")[1] == "family" && "Parents";
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

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
        setChunks(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setAudioURL(null);
      audioChunks.current = [];
    }
  };

  const handleEmojiClick = (emoji) => {
    const newValue = inputValue + emoji.emoji;
    setInputValue(newValue);
    form.setFieldsValue({ msg: newValue }); // ✅ sync with AntD
  };

  const handleBackToContacts = () => {
    dispatch(clearSelectedContact());
  };

  const viewProfile = (id, type) => {
    if (type == "Nanny") {
      navlink(`/family/profileNanny/${id}`);
    } else {
      navlink(`/nanny/jobDescription/${id}`);
    }
  };

  const handleFavourite = async (id) => {
    await dispatch(addOrRemoveFavouriteThunk({ favouriteUserId: id }));
    await dispatch(refreshTokenThunk());
  };

  const formatTime1 = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const menu = (id, type, chatId) => (
    <Menu>
      <Menu.Item onClick={() => viewProfile(id, type)} key="1">
        View Profile
      </Menu.Item>
    </Menu>
  );

  useLayoutEffect(() => {
    if (messageWindowRef.current) {
      messageWindowRef.current.scrollTop =
        messageWindowRef.current.scrollHeight;
    }
  }, []);

  useLayoutEffect(() => {
    if (messageWindowRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messageWindowRef.current;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      if (isNearBottom) {
        messageWindowRef.current.scrollTop = scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    const messageText = inputValue.trim();
    if (!messageText) return;

    try {
      await handleSendMessage({
        chatId: selectedContact?._id,
        content: messageText,
        senderId: user?._id,
        receiverId: selectedContact?.otherParticipant?._id,
        type: "Text",
      });

      setInputValue(""); // ✅ only clear after successful send
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className=" relative flex flex-col max-h-[calc(100vh-78px)] bg-white w-full">
      <div className="flex justify-between items-center p-4 border-b w-full h-[64px]">
        <div className="flex items-center justify-between w-full">
          {/* <ArrowLeft
            className="w-5 h-5 cursor-pointer reponsive"
            onClick={handleBackToContacts}
          /> */}
          <div className="flex items-center">
            <div className="ml-2 w-10 h-10">
              {selectedContact?.otherParticipant?.imageUrl ? (
                <img
                  style={{ backgroundColor: "#38AEE3" }}
                  className="rounded-full w-10 h-10 object-contain"
                  src={selectedContact?.otherParticipant?.imageUrl}
                  alt={selectedContact?.otherParticipant?.imageUrl}
                />
              ) : (
                <Avatar
                  className="rounded-full object-cover"
                  size="40"
                  color="#38AEE3"
                  name={selectedContact?.otherParticipant?.name
                    ?.split(" ")
                    .slice(0, 2)
                    .join(" ")}
                />
              )}
            </div>
            <span className="ml-4 font-semibold text-md">
              {selectedContact?.otherParticipant?.name}
            </span>
          </div>

          {pathname.split("/")[1] === "nanny" && (
            <div className="h-10 w-10 p-2 flex items-center justify-center rounded-full">
              <MoreVertical />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {nannyShare != selectedContact?.otherParticipant?.type &&
            pathname.split("/")[1] != "nanny" && (
              <Star
                onClick={() =>
                  handleFavourite(selectedContact?.otherParticipant?._id)
                }
                className="w-5 h-5 cursor-pointer"
                fill={
                  user.favourite?.includes(
                    selectedContact?.otherParticipant?._id
                  )
                    ? `#38AEE3`
                    : "white"
                }
                color="#38AEE3"
              />
            )}
          {pathname.split("/")[1] != "nanny" && (
            <Dropdown
              overlay={menu(
                selectedContact?.otherParticipant?._id,
                selectedContact?.otherParticipant?.type,
                selectedContact?._id
              )}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button type="text" icon={<MoreVertical className="w-5 h-5" />} />
            </Dropdown>
          )}
        </div>
      </div>
       {!isSubscribed && (
          <>
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/50 top-[80px] w-full" />
            <div className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-8 py-6 rounded-xl text-center w-[400px]">
            <img src="/message.svg" alt="message" className="mx-auto"/>
              <p className="text-2xl text-center Livvic-SemiBold text-primary mb-2 whitespace-break-spaces">
               Upgrade to see your conversation with {selectedContact?.otherParticipant?.name}
              </p>
              <p className="mb-4 text-center text-primary Livvic-Medium text-sm">
               Upgrade now to see past messages and continue your conversation
              </p>
              <CustomButton btnText={"Upgrade Now"} action={() => navigate('../pricing')} className="bg-[#D6FB9A] text-[#025747] Livvic-SemiBold text-sm"/>
            </div>
          </>
        )}
      <div
        ref={messageWindowRef}
        className="w-full flex-1 overflow-y-auto p-4"
        style={{ minHeight: "calc(100vh - 80px - 64px - 70px)" }} // 64px header + 70px input
      >

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message?.sender?._id == user?._id
                ? "justify-end"
                : "justify-start"
            } p-2`}
          >
            <div>
              {message.type === "Audio" ? (
                <div
                  className={
                    message?.sender?._id === user?._id
                      ? "sender-audio-player"
                      : "receviver-audio-player"
                  }
                >
                  <audio controls controlsList="nodownload">
                    <source
                      src={`data:audio/mp3;base64,${message.content}`}
                      type="audio/mp3"
                    />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div
                  style={
                    message?.sender?._id === user?._id
                      ? {
                          color: "#555555",
                          backgroundColor: "#F5F5F5",
                          maxWidth: "303px",
                          wordBreak: "break-all",
                          borderRadius: "14px",
                          padding: "14px",
                        }
                      : {
                          backgroundColor: "#F5F5F5",
                          maxWidth: "303px",
                          borderRadius: "14px",
                          wordBreak: "break-all",
                          padding: "14px",
                          color: "#555555",
                        }
                  }
                  className={`p-3 ${
                    message?.sender?._id === user?._id
                      ? "bg-primary text-primary-foreground Quicksand text-sm leading-5"
                      : "leading-5 Quicksand"
                  }`}
                >
                  <div className="flex justify-start">
                    <p style={{ color: "#AFB8CF" }} className="text-xs">
                      {formatTime(message.updatedAt)}
                    </p>
                  </div>
                  {message.content}
                </div>
              )}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4 w-full h-[70px] flex items-center">
        <Laugh
          className="w-6 h-6 cursor-pointer"
          fill="#38AEE3"
          color="white"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        />

        {isRecording ? (
          <div
            style={{ background: "#DCE6FF" }}
            className="flex flex-grow items-center space-x-2 ml-2 p-2 rounded-md"
          >
            <div className="wave-container">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
            <span style={{ color: "#38AEE3" }} className="font-medium">
              Recording... {formatTime1(recordingTime)}
            </span>
          </div>
        ) : (
          <div className="flex flex-grow items-center ml-2">
            <Input
              type="text"
              placeholder="Type a message..."
              style={{
                border: "none",
                boxShadow: "none",
                width: "100%",
                fontFamily: "Livvic-Medium",
              }}
              prefix={<img className="object-contain" src={line} alt="line" />}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={async (e) => {
                e.preventDefault();
                const messageText = inputValue.trim();
                if (!messageText) return;

                // Clear immediately
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
                  // Restore message on failure
                  setInputValue(messageText);
                }
              }}
            />

            <Button
              style={{ border: "none" }}
              className="msg-inp-btn"
              onClick={async () => {
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
              }}
            >
              <Send className="w-5 h-5 cursor-pointer" color="#38AEE3" />
            </Button>
          </div>
        )}

        {isRecording ? (
          <>
            <div
              style={{ color: "red" }}
              className="border-none cursor-pointer"
              onClick={cancelRecording}
            >
              <X className="w-5 h-5" />
              <span className="sr-only">Cancel recording</span>
            </div>
            <div
              style={{ color: "#38AEE3" }}
              className="border-none cursor-pointer"
              onClick={stopRecording}
            >
              <Square className="mr-2 w-5 h-5" />
              <span className="sr-only">Stop recording</span>
            </div>
          </>
        ) : (
          <div
            style={{ color: "#38AEE3" }}
            className="border-none cursor-pointer"
            onClick={startRecording}
          >
            <Mic className="mr-2 w-5 h-5" />
            <span className="sr-only">Start recording</span>
          </div>
        )}
      </div>

      {showEmojiPicker && (
        <div className="flex justify-center mx-4 my-2">
          <div className="shadow-lg rounded-lg w-full">
            <EmojiPicker
              width="100%"
              searchDisabled={true}
              onEmojiClick={(emoji) =>
                setInputValue((prev) => prev + emoji.emoji)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
