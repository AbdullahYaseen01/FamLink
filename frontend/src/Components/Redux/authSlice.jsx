import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/api";
import {
  getStoredReferralCode,
  clearStoredReferralCode,
} from "../../Config/referral";
import { getMyReferralThunk } from "./referralSlice";

const initialState = {
  isLoading: false,
  user: {
    _id: "",
    name: "",
    email: "",
    phoneNo: "",
    zipCode: "",
    additionalInfo: [],
    type: "", // Adjust as per your UserType definitions
    dob: new Date(0),
    imageUrl: "",
    location: "",
    favourite: [],
    verified: {},
    reviews: {},
    averageRating: "",
    notifications: {},
    services: [],
    aboutMe: "",
    noOfChildren: {},
  },
  accessToken: null,
  refreshToken: null,
  accessTokenExpiry: null,
  refreshTokenExpiry: null,
};

// Network / CORS / offline failures have no `error.response` — reading
// `.data` threw "Cannot read properties of undefined (reading 'data')"
// and that TypeError was shown as the login toast.
const apiError = (error, fallback = "Something went wrong. Please try again.") => {
  const data = error?.response?.data;
  if (data && typeof data === "object") {
    return {
      ...data,
      message: data.message || fallback,
    };
  }
  if (typeof data === "string" && data.trim()) return { message: data };
  if (error?.code === "ECONNABORTED") {
    return { message: "Request timed out. Please try again." };
  }
  if (!error?.response) {
    return {
      message:
        "Cannot reach the server. Check your connection and try again.",
    };
  }
  return { message: error?.message || fallback };
};

// Thunks for login, register, and refresh token
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (body, { rejectWithValue }) => {
    try {
      const { data, status } = await api.post("/auth/login", body);
      // Ensure your data structure matches this
      return {
        user: data.user,
        accessToken: data.accessToken,
        accessTokenExpiry: data.accessTokenExpiry,
        refreshToken: data.refreshToken,
        refreshTokenExpiry: data.refreshTokenExpiry,
        status,
        message: data.message,
      };
    } catch (error) {
      return rejectWithValue(apiError(error, "Unable to sign in. Please try again."));
    }
  }
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (body, { rejectWithValue }) => {
    try {
      // The referral code is attached here rather than at the ~20 call sites
      // that dispatch this thunk — every onboarding flow, job form and hire
      // form registers through it, and threading a code through all of them
      // would guarantee some path silently drops it.
      const referredByCode = getStoredReferralCode();
      const payload = referredByCode ? { ...body, referredByCode } : body;

      const { data, status } = await api.post("/auth/register", payload);

      // Consume the code on success only — a failed attempt (duplicate email,
      // network drop) is usually retried straight after, and the code needs to
      // survive to that retry.
      if (referredByCode) clearStoredReferralCode();

      return { data, status };
    } catch (error) {
      return rejectWithValue(apiError(error, "Unable to register. Please try again."));
    }
  }
);
export const userCheckThunk = createAsyncThunk(
  "auth/user-check",
  async (body, { rejectWithValue }) => {
    try {
      const { data, status } = await api.post("/auth/check-user", body);
      return { status };
    } catch (error) {
      return rejectWithValue(apiError(error, "Unable to verify account."));
    }
  }
);
export const refreshTokenThunk = createAsyncThunk(
  "auth/refresh-token",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { refreshToken } = state.auth; // Adjust according to your slice structure
      const { data, status } = await api.post(`/auth/refreshToken`, {
        refreshToken,
      });
      return {
        user: data.user,
        accessToken: data.accessToken,
        accessTokenExpiry: data.accessTokenExpiry,
        refreshToken: data.refreshToken,
        refreshTokenExpiry: data.refreshTokenExpiry,
        status,
      };
    } catch (error) {
      return rejectWithValue(apiError(error, "Session expired. Please sign in again."));
    }
  }
);

export const editUserThunk = createAsyncThunk(
  "auth/editUser",
  async (userData, { getState, rejectWithValue }) => {
    try {
      // Get accessToken from state if needed for authorization
      const state = getState();
      const { accessToken } = state.auth;

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization header
        },
      };

      const { data, status } = await api.put("/edit/user", userData, config);
      return {
        user: data.user,
        status,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error editing user data");
    }
  }
);

export const updateNannyProfileThunk = createAsyncThunk(
  "auth/updateNannyProfile",
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth;
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
      };
      const { data, status } = await api.patch("/nanny/nanny-share/profile", profileData, config);
      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error updating nanny profile");
    }
  }
);

export const verifyUserThunk = createAsyncThunk(
  "auth/verifyUser",
  async (userData, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth;
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
      };
      const { data, status } = await api.post("/verify", userData, config);
      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const verifyCriminalRecordThunk = createAsyncThunk(
  "auth/verifyCriminalRecord",
  async (userData, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth;
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
      };
      const { data, status } = await api.post("/verify/criminal-record", userData, config);
      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendOtpThunk = createAsyncThunk(
  "auth/send-otp",
  async (_, { getState, rejectWithValue }) => {
    try {
      // Get accessToken from state if needed for authorization
      const state = getState();
      const { accessToken } = state.auth;

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization header
        },
      };

      const { data, status } = await api.post("/auth/send-otp", config);

      return {
        data,
        status,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error sending otp");
    }
  }
);

export const verifyOtpThunk = createAsyncThunk(
  "auth/verify-otp",
  async (oneTimePass, { getState, rejectWithValue }) => {
    try {
      // Get accessToken from state if needed for authorization
      const state = getState();
      const { accessToken } = state.auth;

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization header
        },
      };

      const { data, status } = await api.post(
        "/auth/verify-otp",
        oneTimePass,
        config
      );

      return {
        data,
        status,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error verify otp");
    }
  }
);

export const resendOtpThunk = createAsyncThunk(
  "auth/resend-otp",
  async (_, { getState, rejectWithValue }) => {
    try {
      // Get accessToken from state if needed for authorization
      const state = getState();
      const { accessToken } = state.auth;

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization header
        },
      };

      const { data, status } = await api.post("/auth/resend-otp", config);

      return {
        data,
        status,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error resend otp");
    }
  }
);

export const deleteUserThunk = createAsyncThunk(
  "auth/deleteUser",
  async (userId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth;

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const { data, status } = await api.delete(`/user/${userId}`, config);

      return { status, message: data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to delete user");
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = initialState.user;
      state.accessToken = initialState.accessToken;
      state.refreshToken = initialState.refreshToken;
      state.accessTokenExpiry = initialState.accessTokenExpiry;
      state.refreshTokenExpiry = initialState.refreshTokenExpiry;
    },
    setNannyProfileCompleted: (state) => {
      state.user.nannyProfileCompleted = true;
    },
    increaseMatchRequestSent: (state) => {
      state.user.matchRequestsSent++;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        if (
          action.payload.user.type === "Parents" ||
          action.payload.user.type === "Nanny"
        ) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.accessTokenExpiry = action.payload.accessTokenExpiry;
          state.refreshToken = action.payload.refreshToken;
          state.refreshTokenExpiry = action.payload.refreshTokenExpiry;
        }
      })

      .addCase(loginThunk.rejected, (state) => {
        state.isLoading = false;
      })
      // Register
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(userCheckThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(userCheckThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(userCheckThunk.rejected, (state) => {
        state.isLoading = false;
      })
      // Refresh Token
      .addCase(refreshTokenThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.accessTokenExpiry = action.payload.accessTokenExpiry;
        state.refreshToken = action.payload.refreshToken;
        state.refreshTokenExpiry = action.payload.refreshTokenExpiry;
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(editUserThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(editUserThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user; // Update the user data in the state
      })
      .addCase(editUserThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(updateNannyProfileThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateNannyProfileThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateNannyProfileThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(verifyUserThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyUserThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user.verified.nationalIDVer = action.payload.data.data; // Update the user data in the state
      })
      .addCase(verifyUserThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(sendOtpThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendOtpThunk.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(sendOtpThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(verifyOtpThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(verifyOtpThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(resendOtpThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resendOtpThunk.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(resendOtpThunk.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteUserThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUserThunk.fulfilled, (state) => {
        state.isLoading = false;
        state.user = initialState.user;
        state.accessToken = null;
        state.refreshToken = null;
        state.accessTokenExpiry = null;
        state.refreshTokenExpiry = null;
      })
      .addCase(deleteUserThunk.rejected, (state) => {
        state.isLoading = false;
      })

      // Referral fields ride along on the user object (login and token refresh
      // both spread the whole document), and Config/matchGate.js reads
      // referralMatchingUntil from there to decide whether a caregiver may
      // still match. That copy only refreshes with the access token — up to two
      // hours — so a caregiver whose friend just signed up would keep hitting
      // the wall they've already cleared. /referral/me returns the live values,
      // so fold them back in wherever it's fetched.
      .addCase(getMyReferralThunk.fulfilled, (state, action) => {
        const { code, referralCount, matchingUntil } = action.payload || {};
        state.user.referralCode = code;
        state.user.referralCount = referralCount;
        state.user.referralMatchingUntil = matchingUntil;
      });

  },
});

export const { logout, setNannyProfileCompleted, increaseMatchRequestSent } = authSlice.actions;

export default authSlice.reducer;
