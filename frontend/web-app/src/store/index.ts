/**
 * Redux Store Configuration
 * AI-Powered eLearning Platform - Frontend
 */

import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './slices/authSlice';
import { userSlice } from './slices/userSlice';
import { coursesSlice } from './slices/coursesSlice';
import { lessonsSlice } from './slices/lessonsSlice';
import { languagesSlice } from './slices/languagesSlice';
import { uiSlice } from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
    courses: coursesSlice.reducer,
    lessons: lessonsSlice.reducer,
    languages: languagesSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;