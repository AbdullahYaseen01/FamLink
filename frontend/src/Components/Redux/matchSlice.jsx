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

            //     // Handle pending state
            // .addCase(checkMatchRequestThunk.pending, (state) => {
            //     state.isMatchLoading = true;
            // })
            // // Handle fulfilled state
            // .addCase(checkMatchRequestThunk.fulfilled, (state, action) => {
            //     state.isMatchLoading = false;
            //     state.matches = action.payload.data; // Store the fetched nannies
            //     state.message = action.payload.message
            // })
            // // Handle rejected state
            // .addCase(checkMatchRequestThunk.rejected, (state) => {
            //     state.isMatchLoading = false;
            // })
    },
});

// Export the reducer
export default matchSlice.reducer;