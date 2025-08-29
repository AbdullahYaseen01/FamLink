import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../Config/api";

const initialState = {
  isLoading: false,
  message: null,
  error: null
}

export const requestOTP = createAsyncThunk(
  "email/request-otp",
  async ({ email }, { getState, rejectWithValue }) => {
    try {
      const { data, status } = await api.post(
        "/email-verification/send-otp",
       { email : email}
      );
      return {data, status};
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error resend otp");
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "email/verify-otp",
  async ({ oneTimePass, email }, { getState, rejectWithValue }) => {
    try {
      const { data, status } = await api.post(
        "/email-verification/verify-otp",
        {
          otp: oneTimePass,
          email: email,
        }
      );
      return {data, status};
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error resend otp");
    }
  }
);

export const resendOTP = createAsyncThunk(
  "email/resend-otp",
  async ({ email }, { getState, rejectWithValue }) => {
    try {
      const { data } = await api.post(
        "/email-verification/resend-otp",
        {email : email}
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error resend otp");
    }
  }
);

const emailSlice = createSlice({
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
        state.error = action.payload || 'Error while requesting otp'
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
        state.error = action.payload || 'Error while verifying otp'
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
      state.error = action.payload || "Error while resending otp";
    });

  }
})

export default emailSlice.reducer

