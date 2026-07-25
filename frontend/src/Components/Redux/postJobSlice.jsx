import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/api";

// Define the initial state
const initialState = {
  isLoading: false,
  data: [], // To store the list of nannies
  pagination: {
    currentPage: 1,
    totalPages: 0,
    pageSize: 0,
    totalRecords: 0,
  },
};

export const postPostJob = createAsyncThunk(
  "postJob/",
  async (body, { rejectWithValue }) => {
    try {
      const { data, status } = await api.post("/postJob", body);
      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAllPostJobThunk = createAsyncThunk(
  "postJob/getFilteredData",
  async (params, { rejectWithValue }) => {
    try {
      // Remove undefined values from params
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined)
      );
      const { data } = await api.get(`/postJob`, {
        params: filteredParams,
      });
      return {
        data: data.data, // Assuming message contains the list of nannies
        pagination: data.pagination, // Assuming pagination info is in this field
      };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchPostJobByIdThunk = createAsyncThunk(
  "postJob/getById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/postJob/${id}`);
    //   console.log(data)
      return data.data; // Assuming message contains the nanny details
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updatePostJobThunk = createAsyncThunk(
  "postJob/updateById",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/postJob/${id}`, body);
      return data; // Return the updated job
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Error updating nanny share"
      );
    }
  }
);

export const deletePostJobThunk = createAsyncThunk(
  "postJob/deleteById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await api.delete(`/postJob/${id}`);
      return data; // Return the deleted ID for removal from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Error deleting nanny share"
      );
    }
  }
);

export const fetchPostJobByCurrentUserThunk = createAsyncThunk(
  "postJob/user-jobs",
  async (_, { getState, rejectWithValue }) => {
    try {
          const state = getState();
      const { accessToken } = state.auth;

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization header
        },
      };
      const { data } = await api.get(`/postJob/user-jobs`, config);
      return data.data; // Assuming message contains the nanny details
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
// Create the slice
const postJobSlice = createSlice({
  name: "postJob",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle pending state
      .addCase(postPostJob.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(postPostJob.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(postPostJob.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(fetchAllPostJobThunk.pending, (state) => {
        state.isLoading = true;
      })
      // Handle fulfilled state
      .addCase(fetchAllPostJobThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data; // Store the fetched nannies
        state.pagination = action.payload.pagination; // Update pagination info
      })
      // Handle rejected state
      .addCase(fetchAllPostJobThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(fetchPostJobByIdThunk.pending, (state) => {
        state.isLoading = true;
      })
      // Handle fulfilled state for fetching nanny by ID
      .addCase(fetchPostJobByIdThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload; // Store the fetched nanny details
      })
      // Handle rejected state for fetching nanny by ID
      .addCase(fetchPostJobByIdThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(updatePostJobThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePostJobThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data; // or update the specific job if needed
      })
      .addCase(updatePostJobThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(deletePostJobThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deletePostJobThunk.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(deletePostJobThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(fetchPostJobByCurrentUserThunk.pending, (state) => {
        state.isLoading = true;
      })
      // Handle fulfilled state
      .addCase(fetchPostJobByCurrentUserThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      // Handle rejected state
      .addCase(fetchPostJobByCurrentUserThunk.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

// Export the reducer
export default postJobSlice.reducer;
