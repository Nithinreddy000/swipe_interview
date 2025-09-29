import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

import candidatesReducer from './slices/candidatesSlice'
import interviewsReducer from './slices/interviewsSlice'
import questionsReducer from './slices/questionsSlice'
import timerReducer from './slices/timerSlice'
import uiReducer from './slices/uiSlice'

const rootReducer = combineReducers({
  candidates: candidatesReducer,
  interviews: interviewsReducer,
  questions: questionsReducer,
  timer: timerReducer,
  ui: uiReducer,
});

const persistConfig = {
  key: 'crisp-interview',
  storage,
  whitelist: ['candidates', 'interviews', 'questions'],
  blacklist: ['timer', 'ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;