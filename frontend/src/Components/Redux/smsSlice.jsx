import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../Config/api";

const initialState = {
  isLoading: false,
  message: null,
  error: null
}

export const requestOTP = createAsyncThunk(
  "sms/request-otp",
  async ({ phoneNo }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth;

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization header
        },
      };
      const { data, status } = await api.post(
        "/sms-verification/send-otp",
       { phoneNo : phoneNo},
        config
      );
      return {data, status};
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error resend otp");
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "sms/verify-otp",
  async ({ oneTimePass, phoneNo }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth;

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization header
        },
      };
      const { data, status } = await api.post(
        "/sms-verification/verify-otp",
        {
          oneTimePass: oneTimePass,
          phoneNo: phoneNo,
        },
        config
      );
      return {data, status};
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error resend otp");
    }
  }
);

export const resendOTP = createAsyncThunk(
  "sms/resend-otp",
  async ({ phoneNo }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth;

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization header
        },
      };
      const { data } = await api.post(
        "/sms-verification/resend-otp",
        { phoneNo: phoneNo },
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error resend otp");
    }
  }
);

const smsSlice = createSlice({
  name: 'sms',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(requestOTP.pending, state => {
        state.isLoading = true
      })
      .addCase(requestOTP.fulfilled, (state, action) => {
        state.isLoading = false
        state.message = action.payload.message
      })
      .addCase(requestOTP.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Error fetching blogs'
      })

      .addCase(verifyOTP.pending, state => {
        state.isLoading = true
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false
        state.message = action.payload.message 
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Error fetching blogs'
      })

    .addCase(resendOTP.pending, (state) => {
      state.isLoading = true;
    })
    .addCase(resendOTP.fulfilled, (state, action) => {
      state.isLoading = false;
       state.message = action.payload.message 
    })
    .addCase(resendOTP.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || "Error fetching blogs by category";
    });

  }
})

export default smsSlice.reducer

