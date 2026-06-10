import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/api";

// Define the initial state
const initialState = {
    isLoading: false,
    nannies: [], // To store the list of nannies
    pagination: {
        currentPage: 1,
        totalPages: 0,
        pageSize: 0,
        totalRecords: 0,
    },
};

// Thunk to fetch all nannies with pagination
export const fetchAllNanniesThunk = createAsyncThunk(
    // "nanny/getAllData",
    // async ({ page, limit }, { rejectWithValue }) => {
    //     try {
    //         const { data } = await api.get(`/nanny/getAllData`, {
    //             params: { page, limit }
    //         });
    //         return {
    //             nannies: data.message, // Assuming message contains the list of nannies
    //             pagination: data.pagination, // Assuming pagination info is in this field
    //         };
    //     } catch (error) {
    //         return rejectWithValue(error.response.data);
    //     }
    // }
    "nanny/getFilteredData",
    async ({ page, limit, avaiForWorking, ageGroupsExp, interestedPosi, salaryRange, location }, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/userData/getFiltered`, {
                params: {
                    userType: "Nanny",
                    page,
                    limit,
                    avaiForWorking,
                    ageGroupsExp,
                    interestedPosi,
                    salaryRange,
                    location,
                },
            });

            return {
                nannies: data.message, // Assuming message contains the list of nannies
                pagination: data.pagination, // Assuming pagination info is in this field
            };
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchNannyByIdThunk = createAsyncThunk(
    "nanny/getById",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/userData/getById/${id}?t=${new Date().getTime()}`);
            return data.message; // Assuming message contains the nanny details
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Create the slice
const nannySlice = createSlice({
    name: "nanny",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Handle pending state
            .addCase(fetchAllNanniesThunk.pending, (state) => {
                state.isLoading = true;
            })
            // Handle fulfilled state
            .addCase(fetchAllNanniesThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.nannies = action.payload.nannies; // Store the fetched nannies
                state.pagination = action.payload.pagination; // Update pagination info
            })
            // Handle rejected state
            .addCase(fetchAllNanniesThunk.rejected, (state) => {
                state.isLoading = false;
            })

            .addCase(fetchNannyByIdThunk.pending, (state) => {
                state.isLoading = true;
            })
            // Handle fulfilled state for fetching nanny by ID
            .addCase(fetchNannyByIdThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedNanny = action.payload; // Store the fetched nanny details
            })
            // Handle rejected state for fetching nanny by ID
            .addCase(fetchNannyByIdThunk.rejected, (state) => {
                state.isLoading = false;
            });
    },
});

// Export the reducer
export default nannySlice.reducer;
