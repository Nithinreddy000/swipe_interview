import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Timer } from '@/types/index'

const initialState: Timer = {
  isRunning: false,
  remainingTime: 0,
  totalTime: 0,
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    startTimer: (state, action: PayloadAction<number>) => {
      state.isRunning = true;
      state.totalTime = action.payload;
      state.remainingTime = action.payload;
    },
    pauseTimer: (state) => {
      state.isRunning = false;
    },
    resumeTimer: (state) => {
      state.isRunning = true;
    },
    stopTimer: (state) => {
      state.isRunning = false;
      state.remainingTime = 0;
      state.totalTime = 0;
    },
    tick: (state) => {
      if (state.isRunning && state.remainingTime > 0) {
        state.remainingTime -= 1;
      }
      if (state.remainingTime <= 0) {
        state.isRunning = false;
      }
    },
    setRemainingTime: (state, action: PayloadAction<number>) => {
      state.remainingTime = action.payload;
    },
  },
});

export const { startTimer, pauseTimer, resumeTimer, stopTimer, tick, setRemainingTime } = timerSlice.actions;
export default timerSlice.reducer;