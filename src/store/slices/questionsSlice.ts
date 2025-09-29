import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Question } from '@/types/index'

interface QuestionsState {
  questions: Question[];
  loading: boolean;
  error?: string;
}

const initialState: QuestionsState = {
  questions: [],
  loading: false,
  error: undefined,
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    addQuestion: (state, action: PayloadAction<Omit<Question, 'id'>>) => {
      const question: Question = {
        ...action.payload,
        id: crypto.randomUUID(),
      };
      state.questions.push(question);
    },
    updateQuestion: (state, action: PayloadAction<{ id: string; updates: Partial<Question> }>) => {
      const index = state.questions.findIndex(q => q.id === action.payload.id);
      if (index !== -1) {
        state.questions[index] = { ...state.questions[index], ...action.payload.updates };
      }
    },
    removeQuestion: (state, action: PayloadAction<string>) => {
      state.questions = state.questions.filter(q => q.id !== action.payload);
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
  },
});

export const { addQuestion, updateQuestion, removeQuestion, setQuestions } = questionsSlice.actions;
export default questionsSlice.reducer;