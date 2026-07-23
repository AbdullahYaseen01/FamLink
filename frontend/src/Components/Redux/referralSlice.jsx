import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/api";

// Caregiver referral state — the share code, how many friends have joined, and
// how long the earned free matching runs for. Fetched on demand by the refer-a-
// friend screen and by the gate modal.

const initialState = {
  isLoading: false,
  error: null,

  code: null,
  link: null,
  // Friends whose profile is finished — these are the ones that paid out.
  referralCount: 0,
  // Signed up through the link but haven't completed a profile yet, so they
  // haven't earned anything. Worth showing: it's the referrer's cue to nudge.
  pendingCount: 0,
  matchingUntil: null,
  hasActiveMatching: false,
  daysLeft: 0,
  // True when this account is on the referral model (Nanny + hasFamily false)
  // rather than the subscription paywall.
  isReferralGated: false,
  freeMatchUsed: false,

  friends: [],
  areFriendsLoading: false,
};

export const getMyReferralThunk = createAsyncThunk(
  "referral/me",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/referral/me");
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to load referral" });
    }
  }
);

export const getReferredFriendsThunk = createAsyncThunk(
  "referral/friends",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/referral/friends");
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to load friends" });
    }
  }
);

const referralSlice = createSlice({
  name: "referral",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getMyReferralThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyReferralThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        Object.assign(state, action.payload);
      })
      .addCase(getMyReferralThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to load referral";
      })

      .addCase(getReferredFriendsThunk.pending, (state) => {
        state.areFriendsLoading = true;
      })
      .addCase(getReferredFriendsThunk.fulfilled, (state, action) => {
        state.areFriendsLoading = false;
        state.friends = action.payload || [];
      })
      .addCase(getReferredFriendsThunk.rejected, (state) => {
        state.areFriendsLoading = false;
      });
  },
});

export default referralSlice.reducer;
