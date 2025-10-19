import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  closeChat,
  createChatThunk,
  getChatByIdThunk,
  getChatsThunk,
  increaseUnReadMessages,
  markMessagesAsRead,
  pushMessage,
  setMessages,
} from "../Components/Redux/chatSlice";
import useSocket from "./socket";
import { setSelectedContact } from "../Components/Redux/selectedContactSlice";
import { fireToastMessage } from "../toastContainer";

export const useChats = ({ chatId, data }) => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const { chatList, chatDetails, messages } = useSelector(
    (state) => state.chat
  );

  const handleMarkMessagesAsSeen = useCallback(
    (chatId, userId) => {
      socket?.emit("messagesSeen", { chatId, userId });
    },
    [socket]
  );

  const handleMessagesSeen = useCallback(() => {
    socket?.on("messagesSeen", (chatId) => {
      dispatch(markMessagesAsRead(chatId));
    });
  }, [socket, dispatch]);

  const handleGetChatDetailsById = useCallback(
    async (chatId) => {
      if (!chatId) return;
      setIsLoading(true);
      socket?.emit("joinChat", { chatId });

      // Listen for previous messages
      socket?.on("previousMessages", async (msgs) => {
        dispatch(setMessages(msgs)); // Update Redux state

        handleMarkMessagesAsSeen(chatId, user._id);
      });

      // Fetch additional chat details
      try {
        await dispatch(getChatByIdThunk({ chatId, userId: user._id }));
      } catch (err) {
        console.error("Error fetching chat details:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [socket, user, dispatch, handleMarkMessagesAsSeen]
  );

  const handleSendMessage = useCallback(
    async (content) => {
      if (content) {
        // Emit the message and wait for it to complete
        await new Promise(async (resolve) => {
          socket?.emit("sendMessage", { content }, resolve);
          handleGetChatDetailsById(content.chatId);
          const updateContent = {
            ...content,
            type: "Message",
          };
          socket?.emit("sendNotification", { content: updateContent }, resolve);
          await dispatch(getChatsThunk()); // Assuming resolve will be called after successful emit
        });

        // Re-fetch the chat details after sending the message
      }
    },
    [socket, dispatch, handleGetChatDetailsById]
  );

  const handleReciveMessages = useCallback(() => {
    socket?.on("newMessage", (message) => {
      if (message.chatId === chatId) {
        dispatch(pushMessage(message));
        handleMarkMessagesAsSeen(chatId, user._id);
      } else {
        if (message.sender._id !== user._id)
          dispatch(increaseUnReadMessages(message));
      }
    });
  }, [socket, user, chatId, handleMarkMessagesAsSeen, dispatch]);

  const handleCloseChat = useCallback(() => {
    dispatch(closeChat());
  }, [dispatch]);

  const handleSocketCleanUp = useCallback(() => {
    ("Cleaning up socket listeners...");
    socket?.off("newMessage");
    socket?.off("previousMessages");
    socket?.off("messagesSeen");
    socket?.off("newNotification");
  }, [socket]);

  useEffect(() => {
    const fetchChatDetails = async () => {
      try {
        setIsLoading(true);
        // Fetch the user's chats
        await dispatch(getChatsThunk(user._id));

        if (chatId) {
          // Fetch details for the current chat if chatId exists
          handleGetChatDetailsById(chatId);
        } else {
          // If no chatId and the data has no chat ID, create a new chat

          if (data && data?._id == null) {
            try {
              if (!data?.otherParticipant?._id) {
                throw new Error("Other participant ID is missing.");
              }

              // Prepare participants array
              const participants = [data?.otherParticipant?._id, user?._id];

              // Dispatch createChatThunk
              const { data: newChatData, status } = await dispatch(
                createChatThunk({ participants })
              ).unwrap();

              if (!newChatData?._id) {
                throw new Error("New chat ID is missing.");
              }

              // Update selected contact in Redux

              // Fetch updated chats
              const { data: updatedChats } = await dispatch(
                getChatsThunk()
              ).unwrap();
              dispatch(
                setSelectedContact(updatedChats[updatedChats.length - 1])
              );
              // Fetch chat details by ID
              handleGetChatDetailsById(newChatData._id);
            } catch (error) {
              console.error("Error creating or fetching chat:", error);
            }
          } else {
            "Data is invalid or already contains an ID:", data;
          }
          handleCloseChat(); // Close chat if no chatId and no chat created
        }

        // Additional socket-related operations
        handleReciveMessages();
        handleMessagesSeen();
      } catch (error) {
        fireToastMessage({
          message: "Error while retrieving chats",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Call the async function inside useEffect
    fetchChatDetails();

    return () => {
      handleSocketCleanUp(); // Cleanup on component unmount
    };
  }, [
    user,
    chatId,
    handleGetChatDetailsById,
    handleReciveMessages,
    handleMessagesSeen,
    handleCloseChat,
    handleSocketCleanUp,
    dispatch,
    data,
  ]);

  return {
    chatList,
    chatDetails,
    messages,
    handleSendMessage,
    handleCloseChat,
    isLoading,
  };
};
