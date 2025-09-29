import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Candidate } from '@/types/index'

interface CandidatesState {
  candidates: Candidate[];
  loading: boolean;
  error?: string;
}

const initialState: CandidatesState = {
  candidates: [],
  loading: false,
  error: undefined,
};

export const addCandidate = createAsyncThunk(
  'candidates/add',
  async (candidateData: Omit<Candidate, 'createdAt' | 'updatedAt'>) => {
    const candidate: Candidate = {
      ...candidateData,
      id: candidateData.id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return candidate;
  }
);

export const updateCandidate = createAsyncThunk(
  'candidates/update',
  async ({ id, updates }: { id: string; updates: Partial<Candidate> }) => {
    return {
      id,
      updates: {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    };
  }
);

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    removeCandidate: (state, action: PayloadAction<string>) => {
      state.candidates = state.candidates.filter(c => c.id !== action.payload);
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addCandidate.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(addCandidate.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates.push(action.payload);
      })
      .addCase(addCandidate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateCandidate.fulfilled, (state, action) => {
        const index = state.candidates.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.candidates[index] = { ...state.candidates[index], ...action.payload.updates };
        }
      });
  },
});

export const { removeCandidate, clearError } = candidatesSlice.actions;
export default candidatesSlice.reducer;