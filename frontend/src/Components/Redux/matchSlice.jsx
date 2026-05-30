import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/api";

const initialState = {
    isMatchLoading: false,
    message: "",
    matches: [], // To store the list of match requests
    pagination: {
        currentPage: 1,
        totalPages: 0,
        pageSize: 0,
        totalRecords: 0,
    },
};

// Thunk to sent match request
export const sentMatchRequestThunk = createAsyncThunk(
    "sentMatchRequest",
    async (body, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Authorization header
                },
            };

            const { data } = await api.post(`/match/request`, body, config);
            return data; // Assuming message contains the nanny details
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

// Thunk to get outgoing requests
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

// Thunk to get outgoing requests
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

            return data
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk to get outgoing requests
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

            await api.post(
                `/match/reject-incoming-request?matchId=${matchId}`,
                config
            );

            // return {
            //     ...data,
            // };
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk to check match request status
export const checkMatchRequestThunk = createAsyncThunk(
    "sentMatchRequest",
    async (body, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const { accessToken } = state.auth;

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Authorization header
                },
            };

            const { data } = await api.post(`/match/check-match`, body, config);
            return data; // Assuming message contains the nanny details
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Create the slice
const matchSlice = createSlice({
    name: "matchRequest",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Handle pending state
            .addCase(sentMatchRequestThunk.pending, (state) => {
                state.isMatchLoading = true;
            })
            // Handle fulfilled state
            .addCase(sentMatchRequestThunk.fulfilled, (state, action) => {
                state.isMatchLoading = false;
                state.matches = action.payload.data; // Store the fetched nannies
                state.message = action.payload.message
            })
            // Handle rejected state
            .addCase(sentMatchRequestThunk.rejected, (state) => {
                state.isMatchLoading = false;
            })

            .addCase(getOutgoingRequestsThunk.pending, (state) => {
                state.isMatchLoading = true;
            })

            .addCase(getOutgoingRequestsThunk.fulfilled, (state, action) => {
                state.isMatchLoading = false;

                if (action.payload.page === 1) {
                    state.matches = action.payload.data;
                } else {
                    state.matches = [
                        ...state.matches,
                        ...action.payload.data
                    ];
                }

                state.hasMore =
                    action.payload.pagination.hasMore;

                state.message =
                    action.payload.message;
            })

            .addCase(getOutgoingRequestsThunk.rejected, (state) => {
                state.isMatchLoading = false;
            })

            .addCase(getIncomingRequestsThunk.pending, (state) => {
                state.isMatchLoading = true;
            })

            .addCase(getIncomingRequestsThunk.fulfilled, (state, action) => {
                state.isMatchLoading = false;

                if (action.payload.page === 1) {
                    state.matches = action.payload.data;
                } else {
                    state.matches = [
                        ...state.matches,
                        ...action.payload.data
                    ];
                }

                state.hasMore =
                    action.payload.pagination.hasMore;

                state.message =
                    action.payload.message;
            })

            .addCase(getIncomingRequestsThunk.rejected, (state) => {
                state.isMatchLoading = false;
            })


            .addCase(acceptIncomingRequestThunk.pending, (state) => {
                state.isMatchLoading = false;
            })

            .addCase(acceptIncomingRequestThunk.fulfilled, (state, action) => {
                const acceptedMatch = action.payload.data;

                state.matches = state.matches.map((match) => {
                    if (String(match.matchId) === String(acceptedMatch._id)) {
                        return {
                            ...match,
                            status: "accepted",
                        };
                    }

                    return match;
                });

                state.isMatchLoading = false;
            })

            .addCase(acceptIncomingRequestThunk.rejected, (state) => {
                state.isMatchLoading = false;
            });
    },
});

// Export the reducer
export default matchSlice.reducer;