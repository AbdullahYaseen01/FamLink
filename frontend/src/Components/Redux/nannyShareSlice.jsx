import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/api";

// Define the initial state
const initialState = {
  isLoading: false,
  currentProfile: null,
  data: [], // To store the list of nannies
  pagination: {
    currentPage: 1,
    totalPages: 0,
    pageSize: 0,
    totalRecords: 0,
  },
};

export const postNannyShare = createAsyncThunk(
  "nannyShare/",
  async (body, { rejectWithValue, getState }) => {
    console.log(body);
    const { auth } = getState();
    const { accessToken } = auth;
    try {
      const { data, status } = await api.get("/nannyShare", body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // ⚠️ Don't manually set Content-Type here, Axios will handle it
        },
      });
      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const nannyshareProfileThunk = createAsyncThunk(
  "nannyShareProfile/",
   async (body, { rejectWithValue, getState }) => {
    console.log(body);
    const { auth } = getState();
    const { accessToken } = auth;
    try {
      const { data, status } = await api.post("/nanny/nanny-share/profile", body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // ⚠️ Don't manually set Content-Type here, Axios will handle it
        },
      });
      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
)

export const sendQuestionnaireFormEmail = createAsyncThunk(
  "nannyShare/email",
  async (body, { rejectWithValue, getState }) => {
    try {
      const { data, status } = await api.post("/nannyShare/send-questionnaire-email", body);
      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const viewNannyShareProfileThunk = createAsyncThunk(
  "viewNannyShareProfile/",
   async (body, { rejectWithValue, getState }) => {
    console.log(body);
    const { auth } = getState();
    const { accessToken } = auth;
    try {
      const { data, status } = await api.post("/share/show-profiles", body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // ⚠️ Don't manually set Content-Type here, Axios will handle it
        },
      });
      console.log("Data profiles", data)
      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
)

export const viewCurrentUserProfileThunk = createAsyncThunk(
  "viewCurrentUserProfile/",
   async ( _, { rejectWithValue, getState }) => {
    const { auth } = getState();
    const { accessToken } = auth;
    try {
      const { data, status } = await api.get("/share/current-user-profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // ⚠️ Don't manually set Content-Type here, Axios will handle it
        },
      });
      console.log("Data profiles", data)
      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
)

export const fetchAllNanniesShareThunk = createAsyncThunk(
  "nannyShare/getFilteredData",
  async (params, { rejectWithValue }) => {
    try {
      // Remove undefined values from params
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined)
      );

      // console.log('Filtered Params:', filteredParams);

      const { data } = await api.get(`/nannyShare`, {
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

export const fetchNannyShareByIdThunk = createAsyncThunk(
  "nannyShare/getById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/nannyShare/${id}`);
      return data.data; // Assuming message contains the nanny details
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateNannyShareThunk = createAsyncThunk(
  "nannyShare/updateById",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/nannyShare/${id}`, body);
      return data; // Return the updated job
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Error updating nanny share"
      );
    }
  }
);

export const deleteNannyShareThunk = createAsyncThunk(
  "nannyShare/deleteById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await api.delete(`/nannyShare/${id}`);
      return data; // Return the deleted ID for removal from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Error deleting nanny share"
      );
    }
  }
);

// Create the slice
const nannyShareSlice = createSlice({
  name: "nannyShare",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle pending state
      .addCase(postNannyShare.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(postNannyShare.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(postNannyShare.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(viewNannyShareProfileThunk.pending, (state) => {
        state.isLoading = true;
      })
      // Handle fulfilled state
      .addCase(viewNannyShareProfileThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data.data; // Store the fetched nannies
        state.pagination = action.payload.data.pagination; // Update pagination info
      })
      // Handle rejected state
      .addCase(viewNannyShareProfileThunk.rejected, (state) => {
        state.isLoading = false;
      })

       .addCase(viewCurrentUserProfileThunk.pending, (state) => {
        state.isLoading = true;
      })
      // Handle fulfilled state
      .addCase(viewCurrentUserProfileThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProfile = action.payload.data.data; // Store the fetched nannies
      })
      // Handle rejected state
      .addCase(viewCurrentUserProfileThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(fetchNannyShareByIdThunk.pending, (state) => {
        state.isLoading = true;
      })
      // Handle fulfilled state for fetching nanny by ID
      .addCase(fetchNannyShareByIdThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload; // Store the fetched nanny details
      })
      // Handle rejected state for fetching nanny by ID
      .addCase(fetchNannyShareByIdThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(updateNannyShareThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateNannyShareThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        // console.log(action.payload)
        state.data = action.payload.job; // or update the specific job if needed
      })
      .addCase(updateNannyShareThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(deleteNannyShareThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteNannyShareThunk.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(deleteNannyShareThunk.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

// Export the reducer
export default nannyShareSlice.reducer;
