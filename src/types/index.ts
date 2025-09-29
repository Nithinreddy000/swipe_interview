export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumeText?: string;
  resumeUrl?: string;
  skills: string[];
  experience: number;
  education: string;
  position: string;
  interviewStatus: 'pending' | 'in-progress' | 'completed' | 'rejected';
  score?: number;
  interviewId?: string; // Link to associated interview
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'coding' | 'technical' | 'behavioral' | 'system design' | 'problem solving';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  expectedAnswer?: string;
  timeLimit: number;
}

export interface Answer {
  id: string;
  questionId: string;
  candidateId: string;
  text: string;
  timeSpent: number;
  score?: number;
  feedback?: string;
  technicalAccuracy?: number;
  problemSolving?: number;
  communication?: number;
  timeEfficiency?: number;
  suggestions?: string[];
  submittedAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  questions: Question[];
  answers: Answer[];
  status: 'not-started' | 'in-progress' | 'completed';
  startTime?: string;
  endTime?: string;
  totalScore?: number;
  duration: number;
  currentQuestionIndex: number;
  score?: number;
  summary?: string;
}

export interface Timer {
  isRunning: boolean;
  remainingTime: number;
  totalTime: number;
}

export interface AppState {
  candidates: Candidate[];
  interviews: Interview[];
  currentInterview?: Interview;
  questions: Question[];
  timer: Timer;
  ui: {
    loading: boolean;
    error?: string;
    selectedCandidateId?: string;
    searchTerm: string;
    sortBy: 'name' | 'score' | 'date';
    sortOrder: 'asc' | 'desc';
    currentView: 'interviewer' | 'interviewee';
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  summary?: string;
}