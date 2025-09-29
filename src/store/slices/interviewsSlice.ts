import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Interview, Answer, Question } from '@/types/index'
import { evaluateAnswer } from '@/services/openrouterAI'

interface InterviewsState {
  interviews: Interview[]
  currentInterview?: Interview
  loading: boolean
  error?: string
}

const initialState: InterviewsState = {
  interviews: [],
  currentInterview: undefined,
  loading: false,
  error: undefined,
}

export const startInterview = createAsyncThunk(
  'interviews/start',
  async ({ candidateId, questions }: { candidateId: string; questions: Question[] }) => {
    const interview: Interview = {
      id: crypto.randomUUID(),
      candidateId,
      questions,
      answers: [],
      status: 'in-progress',
      startTime: new Date().toISOString(),
      duration: 0,
      currentQuestionIndex: 0,
    }
    return interview
  }
)

export const submitAnswer = createAsyncThunk(
  'interviews/submitAnswer',
  async ({ 
    interviewId, 
    answer, 
    question, 
    candidateName 
  }: { 
    interviewId: string
    answer: Answer
    question: Question
    candidateName: string
  }) => {
    try {
      // Strict pre-check for very short/irrelevant answers
      const trimmed = (answer.text || '').trim().toLowerCase()
      const isBad = !trimmed || trimmed === 'yes' || trimmed === 'no' || trimmed.length < 5
      let evaluation = {
        score: 0,
        feedback: 'Answer is too short or irrelevant.',
        technicalAccuracy: 0,
        problemSolving: 0,
        communication: 0,
        timeEfficiency: 0,
        suggestions: ['Provide a detailed and relevant answer.']
      }
      if (!isBad) {
        evaluation = await evaluateAnswer(question, answer, candidateName)
      }
      const evaluatedAnswer = {
        ...answer,
        score: evaluation.score / 100,
        feedback: evaluation.feedback,
        technicalAccuracy: evaluation.technicalAccuracy / 100,
        problemSolving: evaluation.problemSolving / 100,
        communication: evaluation.communication / 100,
        timeEfficiency: evaluation.timeEfficiency / 100,
        suggestions: evaluation.suggestions
      }
      return { interviewId, answer: evaluatedAnswer }
    } catch (error) {
      console.error('Answer evaluation failed:', error)
      return { interviewId, answer }
    }
  }
)

export const completeInterview = createAsyncThunk(
  'interviews/complete',
  async (interviewId: string) => {
    return {
      interviewId,
      endTime: new Date().toISOString(),
    }
  }
)

const interviewsSlice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {
    setCurrentInterview: (state, action: PayloadAction<string>) => {
      state.currentInterview = state.interviews.find(i => i.id === action.payload)
    },
    nextQuestion: (state) => {
      if (state.currentInterview && 
          state.currentInterview.currentQuestionIndex < state.currentInterview.questions.length - 1) {
        state.currentInterview.currentQuestionIndex += 1
      }
    },
    updateInterviewDuration: (state, action: PayloadAction<{ interviewId: string; duration: number }>) => {
      const interview = state.interviews.find(i => i.id === action.payload.interviewId)
      if (interview) {
        interview.duration = action.payload.duration
      }
      if (state.currentInterview?.id === action.payload.interviewId) {
        state.currentInterview.duration = action.payload.duration
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startInterview.fulfilled, (state, action) => {
        state.interviews.push(action.payload)
        state.currentInterview = action.payload
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        const interview = state.interviews.find(i => i.id === action.payload.interviewId)
        if (interview) {
          interview.answers.push(action.payload.answer)
        }
        if (state.currentInterview?.id === action.payload.interviewId) {
          state.currentInterview.answers.push(action.payload.answer)
        }
      })
      .addCase(completeInterview.fulfilled, (state, action) => {
        const interview = state.interviews.find(i => i.id === action.payload.interviewId)
        if (interview) {
          interview.status = 'completed'
          interview.endTime = action.payload.endTime
        }
        if (state.currentInterview?.id === action.payload.interviewId) {
          state.currentInterview.status = 'completed'
          state.currentInterview.endTime = action.payload.endTime
        }
      })
  },
})

export const { setCurrentInterview, nextQuestion, updateInterviewDuration } = interviewsSlice.actions
export default interviewsSlice.reducer