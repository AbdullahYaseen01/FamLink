import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/api";
import "dotenv";

const initialState = {
  isLoading: false,
  data: [],
  webhookStatus: null, // Add state to track webhook status (e.g., success, failure)
  webhookError: null,
  subscriptionStatus: {
    active: false,
    cancelAtPeriodEnd: false,
    periodEnd: null,
    plan: null,
  },
};
export const saveCardThunk = createAsyncThunk(
  "auth/saveCard",
  async (paymentMethod, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth; // Get access token from state

      const { data, status } = await api.post(
        "/payment/stripe/save-card",
        { paymentMethod }, // Ensure this matches your backend
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Send the token for authentication
          },
        }
      );
      return { data, status }; // Return the response data
    } catch (error) {
      return rejectWithValue(error.response.data); // Handle error
    }
  }
);

export const getSaveCardThunk = createAsyncThunk(
  "auth/getSaveCard",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth; // Get access token from state

      const { data, status } = await api.get(
        "/payment/stripe/get-save-cards", // Ensure this matches your backend
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Send the token for authentication
          },
        }
      );
      return { data, status }; // Return the response data
    } catch (error) {
      return rejectWithValue(error.response.data); // Handle error
    }
  }
);

export const deleteCardThunk = createAsyncThunk(
  "auth/deleteCard",
  async (paymentMethodId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth; // Get access token from state

      const { data, status } = await api.delete(
        `/payment/stripe/delete-card/${paymentMethodId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Send the token for authentication
          },
        }
      );
      return { data, status }; // Return the response data
    } catch (error) {
      console.error("Error deleting card:", error.message);
      return rejectWithValue(error.response.data); // Handle error
    }
  }
);

export const processWebhook = createAsyncThunk(
  "card/processWebhook",
  async (eventData, { rejectWithValue }) => {
    try {
      // Generate timestamp and signature for testing (replace with real signature generation if needed)
      // const timestamp = Math.floor(Date.now() / 1000);
      // const signature = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
      //     .update(`${timestamp}.${JSON.stringify(eventData)}`)
      //     .digest('hex');

      const headers = {
        "Content-Type": "application/json",
      };

      // Send the webhook event data to your backend for processing
      const { data, status } = await api.post(
        "/payment/stripe/webhook",
        eventData,
        { headers }
      );

      return { data, status }; // Return response data after processing webhook
    } catch (error) {
      console.error("Webhook error:", error);
      return rejectWithValue(
        error.response?.data || "Failed to process webhook"
      );
    }
  }
);

export const createSubscriptionThunk = createAsyncThunk(
  "auth/createSubscription",
  async ({ paymentMethodId, priceId }, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth;
      const { data } = await api.post(
        "/payment/stripe/create-subscription",
        { paymentMethodId, planPriceId: priceId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getSubscriptionStatusThunk = createAsyncThunk(
  "card/getSubscriptionStatus",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth;
      const { data } = await api.get("/payment/stripe/subscription-status", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch subscription"
      );
    }
  }
);

export const cancelSubscriptionThunk = createAsyncThunk(
  "auth/cancelSubscription",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth;
      const { data } = await api.post(
        "/payment/stripe/cancel-subscription",
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createPaymentThunk = createAsyncThunk(
  "auth/createPayment",
  async ({ paymentMethodId, amount }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth;

      const { data, status } = await api.post(
        "/payment/stripe/create-payment",
        {
          paymentMethodId,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createCheckoutThunk = createAsyncThunk(
  "auth/createCheckout",
  async ({ priceId }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken } = state.auth;

      const { data, status } = await api.post(
        "/payment/stripe/create-checkout-session",
        {
          priceId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return { data, status };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const cardSlice = createSlice({
  name: "card",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(saveCardThunk.pending, (state) => {
        state.isLoading = true; // Set loading state
      })
      .addCase(saveCardThunk.fulfilled, (state, action) => {
        state.isLoading = false; // Reset loading state
      })
      .addCase(saveCardThunk.rejected, (state) => {
        state.isLoading = false; // Reset loading state on error
      })

      .addCase(getSaveCardThunk.pending, (state) => {
        state.isLoading = true; // Set loading state
      })
      .addCase(getSaveCardThunk.fulfilled, (state, action) => {
        state.isLoading = false; // Reset loading state
        state.data = action.payload.data;
      })
      .addCase(getSaveCardThunk.rejected, (state) => {
        state.isLoading = false; // Reset loading state on error
      })

      .addCase(deleteCardThunk.pending, (state) => {
        state.isLoading = true; // Set loading state
      })
      .addCase(deleteCardThunk.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(deleteCardThunk.rejected, (state) => {
        state.isLoading = false; // Reset loading state on error
      })

      .addCase(createPaymentThunk.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(createSubscriptionThunk.fulfilled, (state, action) => {
        state.subscriptionStatus = {
          active: true,
          plan: action.payload?.plan || null, // you must return `plan` from backend
        };
        state.isLoading = false;
      })

      .addCase(getSubscriptionStatusThunk.fulfilled, (state, action) => {
        state.subscriptionStatus = {
          active: action.payload.active,
          cancelAtPeriodEnd: action.payload.cancelAtPeriodEnd,
          periodEnd: action.payload.periodEnd,
          plan: action.payload.plan,
        };
      })

      .addCase(processWebhook.pending, (state) => {
        state.isLoading = true; // Set loading state
        state.webhookStatus = null; // Reset previous webhook status
        state.webhookError = null; // Reset previous webhook error
      })
      .addCase(processWebhook.fulfilled, (state, action) => {
        state.isLoading = false;
        state.webhookStatus = action.payload.status; // Store webhook processing status
        state.webhookError = null; // Clear error on success
      })
      .addCase(processWebhook.rejected, (state, action) => {
        state.isLoading = false;
        state.webhookError = action.payload || action.error.message; // Store error message
        state.webhookStatus = "failed"; // Set status to failed on error
      });
  },
});

export default cardSlice.reducer;
