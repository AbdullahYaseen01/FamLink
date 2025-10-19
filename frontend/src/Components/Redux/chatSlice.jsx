import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../Config/api";

export const getChatsThunk = createAsyncThunk(
  "chat/get-all",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const { accessToken } = state.auth;
    try {
      const { data, status } = await api.get(`/chats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Send the token for authentication
        },
      });
      return { data, status };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const getChatByIdThunk = createAsyncThunk(
  "chat/get-by-id",
  async ({ chatId, userId }, { rejectWithValue }) => {
    try {
      const { data, status } = await api.get(`/chats/${chatId}/${userId}`);
      return { data, status };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createChatThunk = createAsyncThunk(
  "chat/create-chat",
  async ({ participants }, { rejectWithValue }) => {
    try {
      // Log request data
      const { data, status } = await api.post(`/chats`, {
        participants,
      });
      return { data, status };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteChatThunk = createAsyncThunk(
  "chat/delete-chat",
  async (chatId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth; // Get access token from state

      const { data, status } = await api.delete(`/chats/${chatId}`, {});
      return { data, status }; // Return the response data
    } catch (error) {
      return rejectWithValue(error.response.data); // Handle error
    }
  }
);

const initialState = {
  isLoading: false,
  chatList: [],
  chatDetails: null,
  messages: [],
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    pushMessage: (state, action) => {
      const exists = state.messages.find(
        (msg) => msg._id === action.payload._id
      );
      if (!exists) {
        const message = action.payload;
        state.messages.push(message);
        const chatList = [...state.chatList];
        state.chatList = chatList.map((chat) =>
          chat._id !== message.chatId
            ? chat
            : {
                ...chat,
                lastMessage: message.content,
              }
        );
      }
    },
    increaseUnReadMessages: (state, action) => {
      const message = action.payload;
      const chatList = [...state.chatList];
      state.chatList = chatList.map((chat) =>
        chat._id !== message.chatId
          ? chat
          : {
              ...chat,
              unReadMessages: chat.unReadMessages + 1,
              lastMessage: message.content,
            }
      );
    },
    markMessagesAsRead: (state, action) => {
      const chatId = action.payload;
      const chatList = [...state.chatList];
      state.chatList = chatList.map((chat) =>
        chat._id !== chatId
          ? chat
          : {
              ...chat,
              unReadMessages: 0,
            }
      );
    },
    closeChat: (state) => {
      state.messages = [];
      state.chatDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Chats
      .addCase(getChatsThunk.pending, (state) => {
        // state.isLoading = true;
      })
      .addCase(getChatsThunk.rejected, (state) => {
        // state.isLoading = false;
      })
      .addCase(getChatsThunk.fulfilled, (state, action) => {
        // state.isLoading = false;
        state.chatList = action.payload.data;
      })

      .addCase(createChatThunk.pending, (state) => {
        // state.isLoading = true;
      })
      .addCase(createChatThunk.rejected, (state) => {
        // state.isLoading = false;
      })
      .addCase(createChatThunk.fulfilled, (state, action) => {
        // state.isLoading = false;
      })

      .addCase(getChatByIdThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getChatByIdThunk.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(getChatByIdThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chatDetails = action.payload.data;
      })

      .addCase(deleteChatThunk.pending, (state) => {
        // state.isLoading = true; // Set loading state
      })
      .addCase(deleteChatThunk.fulfilled, (state, action) => {
        // state.isLoading = false;
      })
      .addCase(deleteChatThunk.rejected, (state) => {
        // state.isLoading = false; // Reset loading state on error
      });
  },
});

export const {
  setMessages,
  pushMessage,
  increaseUnReadMessages,
  markMessagesAsRead,
  closeChat,
} = chatSlice.actions;

export default chatSlice.reducer;
