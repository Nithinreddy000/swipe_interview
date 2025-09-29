# 🚀 AI-Powered Interview System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-0170FE?style=for-the-badge&logo=antdesign&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

A modern, enterprise-grade AI-powered interview platform that streamlines technical recruitment through intelligent question generation, automated resume processing, and comprehensive candidate evaluation.

## ✨ Key Features

- 🤖 **AI-Driven Question Generation** - Dynamic questions based on candidate skills and role requirements using Mistral AI
- 📄 **Intelligent Resume Processing** - Automated data extraction using Google Cloud Document AI with PDF parsing fallback
- ⏱️ **Real-Time Interview Flow** - Interactive interview experience with dynamic timers and progress tracking
- 📊 **Automated Answer Evaluation** - AI-powered scoring system with detailed feedback using OpenRouter AI
- 🎯 **Skill-Based Question Mapping** - Questions tailored to candidate's actual expertise areas
- 📈 **Comprehensive Dashboard** - Interviewer interface for candidate management and results analysis
- 💾 **Data Persistence** - Redux Persist for seamless state management across sessions
- 🔒 **Security First** - Secure API key management and error handling

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Interview Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Interviewee │    │ Interviewer │    │    AI Services      │  │
│  │   Portal    │    │ Dashboard   │    │                     │  │
│  └─────────────┘    └─────────────┘    │ • Mistral AI        │  │
│         │                   │          │ • OpenRouter AI     │  │
│         │                   │          │ • Document AI       │  │
│         └───────────────────┼──────────┤                     │  │
│                             │          └─────────────────────┘  │
│  ┌──────────────────────────┼───────────────────────────────┐   │
│  │            Redux Store & State Management                │   │
│  │ • Candidates  • Interviews  • Questions  • Timer  • UI  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **Modern web browser** with ES2020+ support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crisp-interview
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Mistral AI Configuration
   VITE_MISTRAL_API_KEY=your_mistral_api_key_here
   
   # OpenRouter AI Configuration  
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   
   # Google Cloud Document AI (Optional)
   VITE_GOOGLE_CLOUD_PROJECT_ID=your_project_id
   VITE_DOCUMENT_AI_PROCESSOR_ID=your_processor_id
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open Application**
   Navigate to `http://localhost:5173` in your browser

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

### Root Directory
```
crisp-interview/
├── 📄 README.md                 # This documentation file
├── 📄 package.json              # Project dependencies and scripts
├── 📄 vite.config.ts            # Vite build configuration
├── 📄 tsconfig.json             # TypeScript configuration
├── 📄 eslint.config.js          # ESLint linting rules
└── 📄 index.html                # Application entry point
```

### Source Code Structure (`src/`)

#### 📱 **Pages** (`src/pages/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `interviewee/IntervieweePage.tsx` | Candidate interview interface | Resume upload, AI question flow, timer management, completion handling |
| `interviewer/InterviewerDashboard.tsx` | Recruiter management dashboard | Candidate overview, interview results, search/filter capabilities |

#### 🧩 **Components** (`src/components/`)
| Directory | Files | Purpose |
|-----------|-------|---------|
| `interview/` | `QuestionDisplay.tsx`<br>`AnswerInput.tsx`<br>`InterviewProgress.tsx` | Core interview UI components for question presentation, answer input, and progress tracking |
| `resume/` | `ResumeUpload.tsx` | PDF upload and processing interface with drag-and-drop support |
| `ui/` | `Navigation.tsx`<br>`ErrorBoundary.tsx`<br>`VirtualizedTable.tsx` | Reusable UI components for navigation, error handling, and performance-optimized data display |

#### 🧠 **State Management** (`src/store/`)
| File | Responsibility | Data Managed |
|------|---------------|--------------|
| `index.ts` | Store configuration with Redux Persist | Root store setup, persistence config |
| `slices/candidatesSlice.ts` | Candidate data operations | Candidate profiles, status updates, CRUD operations |
| `slices/interviewsSlice.ts` | Interview session management | Active interviews, questions, answers, completion status |
| `slices/questionsSlice.ts` | Question bank management | Generated questions, categorization |
| `slices/timerSlice.ts` | Interview timing control | Question timers, pause/resume functionality |
| `slices/uiSlice.ts` | UI state management | Loading states, error messages, navigation |

#### 🔌 **Services** (`src/services/`)
| File | Purpose | Integration |
|------|---------|-------------|
| `mistral.ts` | AI question generation | Mistral AI API for dynamic, skill-based question creation |
| `openrouterAI.ts` | Answer evaluation system | OpenRouter AI for scoring and feedback generation |
| `documentAI.ts` | Resume processing service | Google Cloud Document AI + fallback PDF parsing |

#### 🔧 **Utilities** (`src/utils/`)
| File | Purpose | Features |
|------|---------|----------|
| `performance.ts` | Performance optimization utilities | Time formatting, measurement helpers |
| `algorithms.ts` | Data processing algorithms | Search, sort, and filter optimizations |
| `scoring.ts` | Interview scoring calculations | Score aggregation and analysis |

#### 🎣 **Custom Hooks** (`src/hooks/`)
| File | Purpose | Performance Benefits |
|------|---------|---------------------|
| `useOptimizedSearch.ts` | Debounced search functionality | Reduces API calls, improves UX |
| `useHighPerformanceTimer.ts` | Optimized timer implementation | Efficient interval management |
| `usePerformanceMonitor.ts` | Performance tracking | Real-time performance metrics |

#### ⚙️ **Configuration** (`src/config/`)
| File | Purpose | Usage |
|------|---------|-------|
| `pdfjs.ts` | PDF.js worker configuration | PDF processing setup for resume parsing |
| `googleCloud.json` | Service account credentials | Google Cloud Document AI authentication |

## 🤖 AI Services Integration

### Mistral AI - Question Generation
- **Purpose**: Generates contextual interview questions based on candidate skills
- **Model**: Uses advanced language models for question variety
- **Features**: 
  - Skill-based question mapping
  - Difficulty progression (Easy → Medium → Hard)
  - Question type variety (Technical, Coding, Behavioral)
  - Anti-repetition mechanisms

```typescript
// Question generation example
const question = await generateQuestion({
  difficulty: 'medium',
  topic: 'React Hooks',
  type: 'technical',
  candidateSkills: ['React', 'JavaScript'],
  candidateRole: 'Frontend Developer',
  previousQuestions: [...]
});
```

### OpenRouter AI - Answer Evaluation  
- **Purpose**: Automated scoring and feedback for candidate responses
- **Model**: Mistral-7B-Instruct via OpenRouter
- **Scoring Metrics**:
  - Technical Accuracy (0-100)
  - Problem Solving (0-100) 
  - Communication (0-100)
  - Time Efficiency (0-100)
  - Overall Score with detailed feedback

```typescript
// Answer evaluation example
const evaluation = await evaluateAnswer(question, answer, candidateName);
// Returns: { score, feedback, technicalAccuracy, problemSolving, communication, timeEfficiency, suggestions }
```

### Google Cloud Document AI - Resume Processing
- **Purpose**: Intelligent resume data extraction
- **Fallback**: PDF.js parsing for offline operation
- **Extracted Data**:
  - Personal information (name, email, phone)
  - Skills and technologies
  - Work experience
  - Education details
  - Professional summary

## 📊 Data Flow & State Management

### Redux Store Architecture

```typescript
RootState {
  candidates: {
    candidates: Candidate[];
    loading: boolean;
    error?: string;
  };
  interviews: {
    interviews: Interview[];
    currentInterview?: Interview;
    loading: boolean;
    error?: string;
  };
  questions: Question[];
  timer: {
    isRunning: boolean;
    remainingTime: number;
    totalTime: number;
  };
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
```

### Data Persistence
- **Technology**: Redux Persist with localStorage
- **Persisted Slices**: candidates, interviews, questions
- **Non-Persisted**: timer, ui (for session management)
- **Benefits**: Seamless resume functionality, data integrity

### Interview Flow State Transitions
1. **Candidate Upload** → Resume Processing → Data Extraction
2. **Interview Start** → Question Generation → Timer Activation
3. **Answer Submission** → AI Evaluation → Progress Update
4. **Interview Completion** → Score Calculation → Dashboard Update

## 🎨 Component Architecture

### Interview Components
- **QuestionDisplay**: Renders questions with type indicators and formatting
- **AnswerInput**: Controlled text input with validation and character limits
- **InterviewProgress**: Visual progress indicator with step tracking

### Resume Processing
- **ResumeUpload**: Drag-and-drop interface with file validation and processing feedback

### Performance Components
- **VirtualizedTable**: Efficiently renders large candidate datasets
- **ErrorBoundary**: Graceful error handling and recovery

## ⚡ Performance Optimizations

### Search & Filter Optimization
```typescript
// Debounced search implementation
const useOptimizedSearch = (searchTerm: string, data: any[], delay: number = 300) => {
  // Implements debouncing, memoization, and efficient filtering
};
```

### Virtual Rendering
- Large candidate lists rendered using React Virtual
- Smooth scrolling with infinite loading capabilities
- Memory-efficient rendering of thousands of records

### State Optimization
- Selective Redux state persistence
- Optimized re-renders with React.memo
- Efficient data normalization patterns

## 🔒 Security & Best Practices

### API Key Management
- Environment variable configuration
- No hardcoded secrets in source code
- Secure credential handling

### Data Security
- Input validation and sanitization
- XSS protection through React's built-in security
- Secure file upload handling

### Error Handling
- Comprehensive error boundaries
- Graceful API failure handling  
- User-friendly error messages

## 🛠️ Development Workflow

### Available Scripts
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint for code quality
```

### Development Server
- **URL**: http://localhost:5173
- **Hot Reload**: Automatic browser refresh on file changes
- **Source Maps**: Full TypeScript debugging support

### Build Process
- **Bundler**: Vite for fast builds and optimized output
- **TypeScript**: Full type checking and compilation
- **Tree Shaking**: Automated dead code elimination
- **Asset Optimization**: Automatic image and file optimization

## 🚢 Deployment

### Production Build
```bash
npm run build
```
Generates optimized static files in the `dist/` directory.

### Environment Configuration
Ensure all environment variables are properly configured in your deployment environment.

### Hosting Recommendations
- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **Server Deployment**: Docker containers, cloud platforms
- **CDN**: Recommended for global performance

## 📋 API Reference

### Interview Question Generation
```typescript
interface QuestionRequest {
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  type: 'coding' | 'technical' | 'behavioral';
  previousQuestions?: Question[];
  candidateSkills?: string[];
  candidateRole?: string;
}
```

### Answer Evaluation
```typescript
interface EvaluationResult {
  score: number;                // Overall score (0-100)
  feedback: string;             // Detailed feedback
  technicalAccuracy: number;    // Technical correctness (0-100)
  problemSolving: number;       // Problem-solving approach (0-100)
  communication: number;        // Communication clarity (0-100)
  timeEfficiency: number;       // Time management (0-100)
  suggestions: string[];        // Improvement suggestions
}
```

## 🤝 Contributing

### Development Standards
- **TypeScript**: Strict type checking required
- **ESLint**: Follow configured linting rules
- **Component Structure**: Functional components with hooks
- **State Management**: Redux Toolkit patterns
- **Testing**: Unit tests for critical functionality

### Code Style
- Use TypeScript interfaces for all data structures
- Implement proper error handling in all async operations
- Follow React best practices for component design
- Maintain consistent naming conventions

### Pull Request Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request with detailed description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Documentation

For additional support or questions about implementation:

- **Technical Issues**: Create an issue in the repository
- **Feature Requests**: Use the feature request template
- **Documentation**: Refer to inline code comments for detailed implementation notes

---

**Built with ❤️ using React, TypeScript, and AI technologies**