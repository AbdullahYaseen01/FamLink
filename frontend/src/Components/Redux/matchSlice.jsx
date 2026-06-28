import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/api";

const initialState = {
    isMatchLoading: false,
    message: "",

    // Bumped every time a match request is successfully sent.
    // Used by views (e.g. ProfileList) to trigger a re-fetch so the
    // profile status reflects the new request without a page refresh.
    requestSentCount: 0,

    // Separate arrays per request type
    incomingMatches: [],
    outgoingMatches: [],

    // Separate pagination per request type
    incomingPagination: {
        currentPage: 1,
        totalPages: 0,
        pageSize: 0,
        totalRecords: 0,
        hasMore: false,
    },
    outgoingPagination: {
        currentPage: 1,
        totalPages: 0,
        pageSize: 0,
        totalRecords: 0,
        hasMore: false,
    },
};

// Thunk to send match request
export const sentMatchRequestThunk = createAsyncThunk(
    "sentMatchRequest",
    async (body, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.post(`/match/request`, body, config);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Thunk to get outgoing requests
export const getOutgoingRequestsThunk = createAsyncThunk(
    "getOutgoingRequests",
    async (
        { page = 1, limit = 10 },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.get(
                `/match/get-outgoing-requests?page=${page}&limit=${limit}`,
                config
            );

            return {
                ...data,
                page,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk to get incoming requests
export const getIncomingRequestsThunk = createAsyncThunk(
    "getIncomingRequests",
    async (
        { page = 1, limit = 10, status = "" },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.get(
                `/match/get-incoming-requests?page=${page}&limit=${limit}&status=${status}`,
                config
            );

            return {
                ...data,
                page,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk to accept incoming request
export const acceptIncomingRequestThunk = createAsyncThunk(
    "acceptIncomingRequest",
    async (
        { matchId },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.post(
                `/match/accept-incoming-request?matchId=${matchId}`,
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk to reject incoming request
export const rejectIncomingRequestThunk = createAsyncThunk(
    "rejectIncomingRequest",
    async (
        { matchId },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.post(
                `/match/reject-incoming-request?matchId=${matchId}`,
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const undoRejectedIncomingRequestThunk = createAsyncThunk(
    "undoRejectedIncomingRequest",
    async (
        { matchId },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.post(
                `/match/undo-reject-incoming-request?matchId=${matchId}`,
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk to block a matched profile
export const blockMatchThunk = createAsyncThunk(
    "blockMatch",
    async (
        { matchId },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.post(
                `/match/block-match?matchId=${matchId}`,
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk to unblock a previously blocked profile
export const unblockMatchThunk = createAsyncThunk(
    "unblockMatch",
    async (
        { matchId },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.post(
                `/match/unblock-match?matchId=${matchId}`,
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk to fetch the match between the current user and another user (either
// direction) — used by the chat screen to detect a blocked conversation.
export const getMatchWithUserThunk = createAsyncThunk(
    "getMatchWithUser",
    async (
        { userId },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.get(
                `/match/get-match-with-user?userId=${userId}`,
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk to check match request status
export const checkMatchRequestThunk = createAsyncThunk(
    "checkMatchRequest",
    async (body, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            const { data } = await api.post(`/match/check-match`, body, config);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Create the slice
const matchSlice = createSlice({
    name: "matchRequest",
    initialState,
    reducers: {
        clearIncomingMatches: (state) => {
            state.incomingMatches = [];
            state.incomingPagination = initialState.incomingPagination;
        },
        clearOutgoingMatches: (state) => {
            state.outgoingMatches = [];
            state.outgoingPagination = initialState.outgoingPagination;
        },
    },
    extraReducers: (builder) => {
        builder
            // ─── sentMatchRequest ───────────────────────────────────────────
            .addCase(sentMatchRequestThunk.pending, (state) => {
                state.isMatchLoading = true;
            })
            .addCase(sentMatchRequestThunk.fulfilled, (state, action) => {
                state.isMatchLoading = false;
                state.message = action.payload.message;
                state.requestSentCount += 1;
            })
            .addCase(sentMatchRequestThunk.rejected, (state) => {
                state.isMatchLoading = false;
            })

            // ─── getOutgoingRequests ────────────────────────────────────────
            .addCase(getOutgoingRequestsThunk.pending, (state) => {
                state.isMatchLoading = true;
            })
            .addCase(getOutgoingRequestsThunk.fulfilled, (state, action) => {
                state.isMatchLoading = false;

                if (action.payload.page === 1) {
                    state.outgoingMatches = action.payload.data;
                } else {
                    state.outgoingMatches = [
                        ...state.outgoingMatches,
                        ...action.payload.data,
                    ];
                }

                state.outgoingPagination.hasMore = action.payload.pagination.hasMore;
                state.message = action.payload.message;
            })
            .addCase(getOutgoingRequestsThunk.rejected, (state) => {
                state.isMatchLoading = false;
            })

            // ─── getIncomingRequests ────────────────────────────────────────
            .addCase(getIncomingRequestsThunk.pending, (state) => {
                state.isMatchLoading = true;
            })
            .addCase(getIncomingRequestsThunk.fulfilled, (state, action) => {
                state.isMatchLoading = false;

                if (action.payload.page === 1) {
                    state.incomingMatches = action.payload.data;
                } else {
                    state.incomingMatches = [
                        ...state.incomingMatches,
                        ...action.payload.data,
                    ];
                }

                state.incomingPagination.hasMore = action.payload.pagination.hasMore;
                state.message = action.payload.message;
            })
            .addCase(getIncomingRequestsThunk.rejected, (state) => {
                state.isMatchLoading = false;
            })

            // ─── acceptIncomingRequest ──────────────────────────────────────
            .addCase(acceptIncomingRequestThunk.pending, (state) => {
                state.isMatchLoading = true;
            })
            .addCase(acceptIncomingRequestThunk.fulfilled, (state, action) => {
                const acceptedMatch = action.payload.data;

                state.incomingMatches = state.incomingMatches.map((match) => {
                    if (String(match.matchId) === String(acceptedMatch._id)) {
                        return { ...match, status: "accepted" };
                    }
                    return match;
                });

                state.isMatchLoading = false;
            })
            .addCase(acceptIncomingRequestThunk.rejected, (state) => {
                state.isMatchLoading = false;
            })

            // ─── rejectIncomingRequest ──────────────────────────────────────
            .addCase(rejectIncomingRequestThunk.pending, (state) => {
                state.isMatchLoading = true;
            })
            .addCase(rejectIncomingRequestThunk.fulfilled, (state, action) => {
                const rejectedMatch = action.payload.data;

                state.incomingMatches = state.incomingMatches.map((match) => {
                    if (String(match.matchId) === String(rejectedMatch._id)) {
                        return { ...match, status: "rejected" };
                    }
                    return match;
                });

                state.isMatchLoading = false;
            })
            .addCase(rejectIncomingRequestThunk.rejected, (state) => {
                state.isMatchLoading = false;
            })


            // ─── undoRejectedIncomingRequest ──────────────────────────────────────
            .addCase(undoRejectedIncomingRequestThunk.pending, (state) => {
                // state.isMatchLoading = true;
            })
            .addCase(undoRejectedIncomingRequestThunk.fulfilled, (state, action) => {
                const rejectedMatch = action.payload.data;

                state.incomingMatches = state.incomingMatches.map((match) => {
                    if (String(match.matchId) === String(rejectedMatch._id)) {
                        return { ...match, status: "pending" };
                    }
                    return match;
                });

                // state.isMatchLoading = false;
            })
            .addCase(undoRejectedIncomingRequestThunk.rejected, (state) => {
                // state.isMatchLoading = false;
            })

            // ─── blockMatch ───────────────────────────────────────────────────
            .addCase(blockMatchThunk.fulfilled, (state, action) => {
                const updated = action.payload.data;
                const apply = (m) =>
                    String(m.matchId) === String(updated._id)
                        ? { ...m, status: "blocked" }
                        : m;
                state.incomingMatches = state.incomingMatches.map(apply);
                state.outgoingMatches = state.outgoingMatches.map(apply);
            })

            // ─── unblockMatch ─────────────────────────────────────────────────
            .addCase(unblockMatchThunk.fulfilled, (state, action) => {
                const updated = action.payload.data;
                const apply = (m) =>
                    String(m.matchId) === String(updated._id)
                        ? { ...m, status: "accepted" }
                        : m;
                state.incomingMatches = state.incomingMatches.map(apply);
                state.outgoingMatches = state.outgoingMatches.map(apply);
            });
    },
});

export const { clearIncomingMatches, clearOutgoingMatches } = matchSlice.actions;

// Export the reducer
export default matchSlice.reducer;