import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../Config/api'

const initialState = {
  isLoading: false,
}


export const sendOtpThunk = createAsyncThunk(
  'auth/forgot-password/send-otp',
  async (email, { rejectWithValue }) => {
    try {

      const { data, status } = await api.post('/auth/forgot-password', email)

      return {
        data,
        status
      }
    } catch (error) {
      
      return rejectWithValue(error.response?.data || 'Error sending otp')
    }
  }
)

export const verifyOtpThunk = createAsyncThunk(
  'auth/forgot-password/reset-password',
  async ({otp, newPassword}, { rejectWithValue }) => {
    try {
      const { data, status } = await api.post(
        '/auth/reset-password',
       { otp,
        newPassword}
      )

      return {
        data,
        status
      }
    } catch (error) {
      
      return rejectWithValue(error.response?.data || 'Error verify otp')
    }
  }
)

// Link-based password reset: request the branded reset email (template 10).
export const requestPasswordResetThunk = createAsyncThunk(
  'auth/request-password-reset',
  async ({ email }, { rejectWithValue }) => {
    try {
      const { data, status } = await api.post('/auth/request-password-reset', {
        email,
      })
      return { data, status }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Error requesting password reset'
      )
    }
  }
)

// Link-based password reset: consume the emailed token and set a new password.
export const resetPasswordWithTokenThunk = createAsyncThunk(
  'auth/reset-password-token',
  async ({ email, token, newPassword }, { rejectWithValue }) => {
    try {
      const { data, status } = await api.post('/auth/reset-password-token', {
        email,
        token,
        newPassword,
      })
      return { data, status }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Error resetting password'
      )
    }
  }
)

export const resendOtpThunk = createAsyncThunk(
  'auth/email-resend-otp',
  async (email, { rejectWithValue }) => {
    try {
      

      const { data, status } = await api.post('/auth/email-resend-otp', email)

      return {
        data,
        status
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error resend otp')
    }
  }
)
const authSlice = createSlice({
  name: 'auth',
  initialState,
  extraReducers: builder => {
    builder
      // Login

      .addCase(sendOtpThunk.pending, state => {
        state.isLoading = true
      })
      .addCase(sendOtpThunk.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(sendOtpThunk.rejected, state => {
        state.isLoading = false
      })

      .addCase(verifyOtpThunk.pending, state => {
        state.isLoading = true
      })
      .addCase(verifyOtpThunk.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(verifyOtpThunk.rejected, state => {
        state.isLoading = false
      })

      .addCase(resendOtpThunk.pending, state => {
        state.isLoading = true
      })
      .addCase(resendOtpThunk.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(resendOtpThunk.rejected, state => {
        state.isLoading = false
      })

      .addCase(requestPasswordResetThunk.pending, state => {
        state.isLoading = true
      })
      .addCase(requestPasswordResetThunk.fulfilled, state => {
        state.isLoading = false
      })
      .addCase(requestPasswordResetThunk.rejected, state => {
        state.isLoading = false
      })

      .addCase(resetPasswordWithTokenThunk.pending, state => {
        state.isLoading = true
      })
      .addCase(resetPasswordWithTokenThunk.fulfilled, state => {
        state.isLoading = false
      })
      .addCase(resetPasswordWithTokenThunk.rejected, state => {
        state.isLoading = false
      })
  }
})

export default authSlice.reducer
