import { createSlice } from '@reduxjs/toolkit';

const defaultFlowState = {
  messages: [],
  answers: {},
  currentQuestionIndex: 0,
  isComplete: false,
  hasStarted: false,
  potentialMatches: [],
};

const defaultState = {
  family: { ...defaultFlowState },
  caregiver: { ...defaultFlowState },
  isTyping: false
};

const loadState = () => {
  try {
    const serializedState = sessionStorage.getItem('chatOnboardingState');
    if (serializedState === null) {
      return undefined;
    }
    const parsedState = JSON.parse(serializedState);
    if (parsedState.messages !== undefined && parsedState.family === undefined) {
      sessionStorage.removeItem('chatOnboardingState');
      return undefined;
    }
    return parsedState;
  } catch (err) {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const stateToSave = { ...state, isTyping: false };
    const serializedState = JSON.stringify(stateToSave);
    sessionStorage.setItem('chatOnboardingState', serializedState);
  } catch (err) {
    // Ignore write errors
  }
};

const initialState = loadState() || defaultState;

const chatOnboardingSlice = createSlice({
  name: 'chatOnboarding',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const { variant, message } = action.payload;
      state[variant].messages.push(message);
      state[variant].hasStarted = true;
      saveState(state);
    },
    setMessages: (state, action) => {
      const { variant, messages } = action.payload;
      state[variant].messages = messages;
      state[variant].hasStarted = true;
      saveState(state);
    },
    setAnswer: (state, action) => {
      const { variant, key, value } = action.payload;
      state[variant].answers[key] = value;
      saveState(state);
    },
    setAnswers: (state, action) => {
      const { variant, answers } = action.payload;
      state[variant].answers = answers;
      saveState(state);
    },
    setCurrentQuestionIndex: (state, action) => {
      const { variant, index } = action.payload;
      state[variant].currentQuestionIndex = index;
      saveState(state);
    },
    setIsTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setIsComplete: (state, action) => {
      const { variant, isComplete } = action.payload;
      state[variant].isComplete = isComplete;
      saveState(state);
    },
    setPotentialMatches: (state, action) => {
      const { variant, matches } = action.payload;
      state[variant].potentialMatches = matches;
      saveState(state);
    },
    resetChat: (state, action) => {
      const variant = action.payload;
      if (variant) {
        state[variant] = { ...defaultFlowState };
      } else {
        state.family = { ...defaultFlowState };
        state.caregiver = { ...defaultFlowState };
      }
      state.isTyping = false;
      saveState(state);
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
