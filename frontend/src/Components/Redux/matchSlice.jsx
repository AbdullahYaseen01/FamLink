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
export const getRequestsThunk = createAsyncThunk(
    "getOutgoingRequests",
    async (
        { page = 1, limit = 10, type },
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
                `/match/get-requests?page=${page}&limit=${limit}&type=${type}`,
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

            .addCase(getRequestsThunk.pending, (state) => {
                state.isMatchLoading = true;
            })

            .addCase(getRequestsThunk.fulfilled, (state, action) => {
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

            .addCase(getRequestsThunk.rejected, (state) => {
                state.isMatchLoading = false;
            });
    },
});

// Export the reducer
export default matchSlice.reducer;