import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
  try {
    const serializedState = sessionStorage.getItem('chatOnboardingState');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    // don't save isTyping
    const stateToSave = { ...state, isTyping: false };
    const serializedState = JSON.stringify(stateToSave);
    sessionStorage.setItem('chatOnboardingState', serializedState);
  } catch (err) {
    // Ignore write errors
  }
};

const initialState = loadState() || {
  messages: [],
  answers: {},
  currentQuestionIndex: 0,
  isTyping: false,
  isComplete: false,
  hasStarted: false,
  potentialMatches: [],
};

const chatOnboardingSlice = createSlice({
  name: 'chatOnboarding',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
      state.hasStarted = true;
      saveState(state);
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
      state.hasStarted = true;
      saveState(state);
    },
    setAnswer: (state, action) => {
      const { key, value } = action.payload;
      state.answers[key] = value;
      saveState(state);
    },
    setAnswers: (state, action) => {
      state.answers = action.payload;
      saveState(state);
    },
    setCurrentQuestionIndex: (state, action) => {
      state.currentQuestionIndex = action.payload;
      saveState(state);
    },
    setIsTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setIsComplete: (state, action) => {
      state.isComplete = action.payload;
      saveState(state);
    },
    setPotentialMatches: (state, action) => {
      state.potentialMatches = action.payload;
      saveState(state);
    },
    resetChat: (state) => {
      state.messages = [];
      state.answers = {};
      state.currentQuestionIndex = 0;
      state.isTyping = false;
      state.isComplete = false;
      state.hasStarted = false;
      state.potentialMatches = [];
      sessionStorage.removeItem('chatOnboardingState');
    }
  },
});

export const { 
  addMessage, 
  setMessages, 
  setAnswer, 
  setAnswers,
  setCurrentQuestionIndex, 
  setIsTyping, 
  setIsComplete, 
  setPotentialMatches,
  resetChat 
} = chatOnboardingSlice.actions;

export default chatOnboardingSlice.reducer;
