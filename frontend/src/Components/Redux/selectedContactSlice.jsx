// redux/contactSlice.js
import { createSlice } from '@reduxjs/toolkit';

const contactSlice = createSlice({
  name: 'contact',
  initialState: {
    selectedContact: null, // Initial state
  },
  reducers: {
    setSelectedContact: (state, action) => {
      console.log("PAYLOAD", action.payload);
      state.selectedContact = action.payload;
    },
    clearSelectedContact: (state) => {
      state.selectedContact = null;
    },
  },
});

export const { setSelectedContact, clearSelectedContact } = contactSlice.actions;
export default contactSlice.reducer;