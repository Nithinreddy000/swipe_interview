import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  loading: boolean;
  error?: string;
  selectedCandidateId?: string;
  searchTerm: string;
  sortBy: 'name' | 'score' | 'date';
  sortOrder: 'asc' | 'desc';
  currentView: 'interviewer' | 'interviewee';
}

const initialState: UiState = {
  loading: false,
  error: undefined,
  selectedCandidateId: undefined,
  searchTerm: '',
  sortBy: 'date',
  sortOrder: 'desc',
  currentView: 'interviewer',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = undefined;
    },
    setSelectedCandidate: (state, action: PayloadAction<string | undefined>) => {
      state.selectedCandidateId = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'name' | 'score' | 'date'>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    setCurrentView: (state, action: PayloadAction<'interviewer' | 'interviewee'>) => {
      state.currentView = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setSelectedCandidate,
  setSearchTerm,
  setSortBy,
  setSortOrder,
  setCurrentView,
} = uiSlice.actions;

export default uiSlice.reducer;