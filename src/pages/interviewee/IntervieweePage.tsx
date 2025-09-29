import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Button, Typography, Space, Progress, message, Modal, Input, Form, Steps } from 'antd'
import { ClockCircleOutlined, SendOutlined, PauseCircleOutlined, PlayCircleOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, store } from '@/store/index'
import { startTimer, pauseTimer, resumeTimer, tick } from '@/store/slices/timerSlice'
import { startInterview, submitAnswer, nextQuestion, completeInterview } from '@/store/slices/interviewsSlice'
import { addCandidate, updateCandidate } from '@/store/slices/candidatesSlice'
import { generateQuestion } from '@/services/mistral'
import { formatTime } from '@/utils/performance'
import QuestionDisplay from '@/components/interview/QuestionDisplay'
import AnswerInput from '@/components/interview/AnswerInput'
import InterviewProgress from '@/components/interview/InterviewProgress'
import ResumeUpload from '@/components/resume/ResumeUpload'

const { Title, Text } = Typography
const { TextArea } = Input

interface CandidateInfo {
  name: string
  email: string
  phone: string
  skills?: string[]
  position?: string
  experience?: number
  education?: string
  summary?: string
}

const IntervieweePage = () => {
  const { candidateId } = useParams<{ candidateId: string }>()
  const dispatch = useDispatch()
  
  const candidate = useSelector((state: RootState) => 
    state.candidates.candidates.find(c => c.id === candidateId)
  )
  const currentInterview = useSelector((state: RootState) => state.interviews.currentInterview)
  const timer = useSelector((state: RootState) => state.timer)
  
  const [answer, setAnswer] = useState('')
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    name: '',
    email: '',
    phone: '',
    skills: [],
    position: '',
    experience: 0,
    education: '',
    summary: ''
  })
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)
  const [form] = Form.useForm()
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [showCompletionMessage, setShowCompletionMessage] = useState(false)

  // Check for unfinished interview on component mount
  useEffect(() => {
    const unfinishedInterview = localStorage.getItem('unfinishedInterview')
    if (unfinishedInterview && !isInterviewStarted) {
      setShowWelcomeBack(true)
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (timer.isRunning) {
      interval = setInterval(() => {
        dispatch(tick())
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [timer.isRunning, dispatch])

  useEffect(() => {
    if (timer.remainingTime === 0 && timer.isRunning) {
      handleAutoSubmit()
    }
  }, [timer.remainingTime, timer.isRunning])

  const handleResumeUpload = (extractedInfo: Partial<CandidateInfo>) => {
    console.log('Resume upload result:', extractedInfo)
    
    // Update candidate info with extracted data
    const updatedInfo = {
      name: extractedInfo.name || '',
      email: extractedInfo.email || '',
      phone: extractedInfo.phone || '',
      skills: extractedInfo.skills || [],
      position: extractedInfo.position || 'Full Stack Developer',
      experience: extractedInfo.experience || 0,
      education: extractedInfo.education || '',
      summary: extractedInfo.summary || ''
    }
    
    setCandidateInfo(updatedInfo)
    
    // Check for missing fields
    const missing = []
    if (!updatedInfo.name) missing.push('name')
    if (!updatedInfo.email) missing.push('email')
    if (!updatedInfo.phone) missing.push('phone')
    
    console.log('Missing fields:', missing)
    setMissingFields(missing)
    
    if (missing.length === 0) {
      console.log('All fields present, moving to step 1')
      setCurrentStep(1) // Move to interview start
      message.success('All information extracted successfully!')
    } else {
      console.log('Missing fields found, moving to step 0.5')
      setCurrentStep(0.5) // Move to missing info collection
      message.warning(`Please provide: ${missing.join(', ')}`)
    }
  }

  const handleMissingInfoSubmit = (values: CandidateInfo) => {
    console.log('Missing info submitted:', values)
    // Merge with existing candidateInfo to preserve any previously extracted data
    const updatedInfo = {
      ...candidateInfo,
      ...values
    }
    setCandidateInfo(updatedInfo)
    setCurrentStep(1)
    message.success('Information collected successfully!')
  }

  const handleStartInterview = async () => {
    if (!candidateInfo.name || !candidateInfo.email || !candidateInfo.phone) {
      message.error('Please complete all required information')
      return
    }

    setIsGeneratingQuestions(true)
    
    try {
      // Generate 6 questions: 2 Easy, 2 Medium, 2 Hard with skill-based topics
      const generateSkillBasedTopics = (skills: string[] = [], difficulty: 'easy' | 'medium' | 'hard') => {
        const skillMap: Record<string, { easy: string[], medium: string[], hard: string[] }> = {
          'react': {
            easy: ['React Components & Props', 'React State & Events', 'JSX Fundamentals'],
            medium: ['React Hooks', 'React Context API', 'Component Lifecycle'],
            hard: ['React Performance Optimization', 'React Advanced Patterns', 'React Server Components']
          },
          'javascript': {
            easy: ['JavaScript ES6+ Features', 'Array Methods', 'Object Manipulation'],
            medium: ['Async/Await & Promises', 'Closures & Scope', 'Event Loop'],
            hard: ['JavaScript Design Patterns', 'Memory Management', 'Advanced Async Patterns']
          },
          'node': {
            easy: ['Node.js Basics', 'NPM & Modules', 'File System Operations'],
            medium: ['Express.js API Design', 'Middleware Concepts', 'Error Handling'],
            hard: ['Node.js Performance', 'Microservices Architecture', 'Cluster & Worker Threads']
          },
          'python': {
            easy: ['Python Basics', 'Data Types & Collections', 'Functions & Modules'],
            medium: ['OOP in Python', 'Decorators', 'File I/O'],
            hard: ['Python Performance', 'Concurrency', 'Advanced Python Features']
          },
          'database': {
            easy: ['SQL Basics', 'Database Design', 'Basic Queries'],
            medium: ['Database Indexing', 'Joins & Relationships', 'Transactions'],
            hard: ['Database Optimization', 'NoSQL vs SQL', 'Database Scaling']
          },
          'aws': {
            easy: ['AWS Basics', 'EC2 Fundamentals', 'S3 Storage'],
            medium: ['AWS Lambda', 'Load Balancers', 'Auto Scaling'],
            hard: ['AWS Architecture', 'Cost Optimization', 'Security Best Practices']
          }
        }
        
        const matchedTopics: string[] = []
        skills.forEach(skill => {
          const normalizedSkill = skill.toLowerCase()
          Object.keys(skillMap).forEach(key => {
            if (normalizedSkill.includes(key)) {
              matchedTopics.push(...skillMap[key][difficulty])
            }
          })
        })
        
        // If no matches, use default topics
        if (matchedTopics.length === 0) {
          const defaultTopics = {
            easy: ['Programming Fundamentals', 'Basic Problem Solving', 'Code Structure'],
            medium: ['Algorithm Design', 'System Design Basics', 'Code Optimization'],
            hard: ['Advanced Algorithms', 'System Architecture', 'Performance Engineering']
          }
          return defaultTopics[difficulty]
        }
        
        return [...new Set(matchedTopics)] // Remove duplicates
      }
      
      const easyTopics = generateSkillBasedTopics(candidateInfo.skills, 'easy')
      const mediumTopics = generateSkillBasedTopics(candidateInfo.skills, 'medium')
      const hardTopics = generateSkillBasedTopics(candidateInfo.skills, 'hard')
      
      console.log('Candidate Skills:', candidateInfo.skills)
      console.log('Candidate Position:', candidateInfo.position)
      console.log('Generated Topics - Easy:', easyTopics)
      console.log('Generated Topics - Medium:', mediumTopics)
      console.log('Generated Topics - Hard:', hardTopics)
      
      const getUniqueRandomTopic = (topics: string[], usedTopics: string[]) => {
        const availableTopics = topics.filter(topic => !usedTopics.includes(topic))
        return availableTopics.length > 0 
          ? availableTopics[Math.floor(Math.random() * availableTopics.length)]
          : topics[Math.floor(Math.random() * topics.length)] // Fallback if all used
      }
      
      // Generate questions sequentially to ensure uniqueness
      const generatedQuestions = []
      const usedTopics: string[] = []
      
      const questionSpecs = [
        // 2 Easy questions
        { difficulty: 'easy' as const, topics: easyTopics, type: 'technical' as const },
        { difficulty: 'easy' as const, topics: easyTopics, type: 'technical' as const },
        // 2 Medium questions
        { difficulty: 'medium' as const, topics: mediumTopics, type: 'coding' as const },
        { difficulty: 'medium' as const, topics: mediumTopics, type: 'technical' as const },
        // 2 Hard questions
        { difficulty: 'hard' as const, topics: hardTopics, type: 'technical' as const },
        { difficulty: 'hard' as const, topics: ['Complex Problem Solving & Leadership'], type: 'behavioral' as const }
      ]
      
      for (const spec of questionSpecs) {
        const selectedTopic = getUniqueRandomTopic(spec.topics, usedTopics)
        usedTopics.push(selectedTopic)
        
        console.log(`Generating question ${generatedQuestions.length + 1}/6: ${spec.difficulty} ${spec.type} about ${selectedTopic}`)
        
        const question = await generateQuestion({
          difficulty: spec.difficulty,
          topic: selectedTopic,
          type: spec.type,
          candidateSkills: candidateInfo.skills,
          candidateRole: candidateInfo.position,
          previousQuestions: generatedQuestions // Pass previously generated questions
        })
        
        generatedQuestions.push(question)
        console.log(`Generated unique question: "${question.text.substring(0, 80)}..."`)
        
        // Small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Create candidate if not exists
      const candidateData = {
        id: candidateId || crypto.randomUUID(),
        name: candidateInfo.name,
        email: candidateInfo.email,
        phone: candidateInfo.phone,
        position: candidateInfo.position || 'Full Stack Developer',
        experience: candidateInfo.experience || 0,
        skills: candidateInfo.skills || [],
        interviewStatus: 'in-progress' as const,
        education: candidateInfo.education || '',
        resumeText: candidateInfo.summary || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Add candidate to store first
      await dispatch(addCandidate(candidateData))
      console.log('Candidate added to store:', candidateData.id)
      
      // Start interview and get the interview data
      const interviewResult = await dispatch(startInterview({ candidateId: candidateData.id, questions: generatedQuestions }))
      console.log('startInterview result:', interviewResult)
      
      let interviewId: string
      if (interviewResult.type === 'interviews/start/fulfilled') {
        interviewId = (interviewResult.payload as any).id
        console.log('Interview started with ID:', interviewId)
        
        // Update candidate with interview ID for better linking
        const updateResult = await dispatch(updateCandidate({
          id: candidateData.id,
          updates: {
            interviewId: interviewId, // Add interview ID to candidate
            updatedAt: new Date().toISOString()
          }
        }))
        console.log('Candidate update result:', updateResult)
        
        // Verify the update was successful
        const verifyState = store.getState()
        const updatedCandidate = verifyState.candidates.candidates.find(c => c.id === candidateData.id)
        console.log('Updated candidate with interview ID:', updatedCandidate)
        
      } else {
        console.error('Failed to start interview:', interviewResult)
        throw new Error('Failed to start interview')
      }
      dispatch(startTimer(getTimeLimit(generatedQuestions[0].difficulty)))
      setIsInterviewStarted(true)
      setStartTime(Date.now())
      setCurrentStep(2)
      
      // Save to localStorage for persistence
      localStorage.setItem('unfinishedInterview', JSON.stringify({
        candidateId: candidateData.id,
        candidateInfo,
        startTime: Date.now()
      }))
      
      message.success('Interview started successfully!')
    } catch (error) {
      console.error('Failed to generate questions:', error)
      message.error('Failed to generate interview questions using AI. Please check your internet connection and try again.')
      // Reset to step 1 so user can retry
      setCurrentStep(1)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!currentInterview || !answer.trim()) {
      message.warning('Please provide an answer')
      return
    }

    const currentQuestion = currentInterview.questions[currentInterview.currentQuestionIndex]
    const timeSpent = currentQuestion.timeLimit - timer.remainingTime

    const answerData = {
      id: crypto.randomUUID(),
      questionId: currentQuestion.id,
      candidateId: currentInterview.candidateId, // Use candidateId from interview instead of route param
      text: answer.trim(),
      timeSpent,
      submittedAt: new Date().toISOString(),
    }

    console.log(`Submitting answer ${currentInterview.currentQuestionIndex + 1}/6:`, answerData)

    try {
      await dispatch(submitAnswer({ 
        interviewId: currentInterview.id, 
        answer: answerData,
        question: currentQuestion,
        candidateName: candidateInfo.name
      }))
      console.log('Answer submitted successfully')
    } catch (error) {
      console.error('Error submitting answer:', error)
      message.error('Failed to submit answer. Please try again.')
      return
    }
    
    if (currentInterview.currentQuestionIndex < currentInterview.questions.length - 1) {
      dispatch(nextQuestion())
      const nextQ = currentInterview.questions[currentInterview.currentQuestionIndex + 1]
      dispatch(startTimer(getTimeLimit(nextQ.difficulty)))
      setAnswer('')
      message.success('Answer submitted! Moving to next question.')
    } else {
      console.log('This was the last question, completing interview...')
      // Small delay to ensure the last answer is properly saved before completion
      setTimeout(() => {
        handleCompleteInterview()
      }, 100)
    }
  }

  const handleAutoSubmit = () => {
    Modal.confirm({
      title: 'Time\'s Up!',
      content: 'The time limit for this question has been reached. Your current answer will be submitted automatically.',
      okText: 'Submit Answer',
      cancelText: 'Review Answer',
      onOk: handleSubmitAnswer,
      onCancel: () => {
        dispatch(pauseTimer())
      },
    })
  }

  const handleCompleteInterview = async () => {
    if (!currentInterview) {
      console.error('No current interview found during completion')
      return
    }

    console.log('Starting interview completion process...')
    console.log('Current interview:', currentInterview)
    console.log('Total answers:', currentInterview.answers.length)
    console.log('All answers:', currentInterview.answers)
    
    // Ensure we have all 6 answers before completing
    if (currentInterview.answers.length !== 6) {
      console.warn(`Interview incomplete! Expected 6 answers, got ${currentInterview.answers.length}`)
      message.warning('Interview seems incomplete. Please ensure all questions were answered.')
    }
    
    try {
      // First, complete the interview in the state
      await dispatch(completeInterview(currentInterview.id))
      console.log('Interview marked as completed in state')
      
      // Get the updated interview from state to ensure we have the latest data
      const updatedState = store.getState()
      const completedInterview = updatedState.interviews.interviews.find(i => i.id === currentInterview.id)
      console.log('Updated interview from state:', completedInterview)
      
      // Calculate overall score from all answers
      const answersToScore = completedInterview?.answers || currentInterview.answers
      const overallScore = calculateOverallScore(answersToScore)
      console.log('Calculated overall score:', overallScore, 'from', answersToScore.length, 'answers')
      
      // Update candidate with final score and status
      const candidateUpdateResult = await dispatch(updateCandidate({
        id: currentInterview.candidateId,
        updates: {
          score: overallScore,
          interviewStatus: 'completed' as const,
          updatedAt: new Date().toISOString()
        }
      }))
      console.log('Candidate updated with completion status:', candidateUpdateResult)
      
      // Verify the candidate update was successful
      if (candidateUpdateResult.type === 'candidates/update/fulfilled') {
        console.log('Candidate update successful')
      } else {
        console.error('Candidate update failed:', candidateUpdateResult)
        throw new Error('Failed to update candidate status')
      }
      
      // Double-check the candidate was updated in the store
      const postUpdateState = store.getState()
      const finalCandidate = postUpdateState.candidates.candidates.find(c => c.id === currentInterview.candidateId)
      console.log('Final candidate after update:', finalCandidate)
      
      if (finalCandidate?.interviewStatus !== 'completed') {
        console.error('Candidate status update failed! Status is still:', finalCandidate?.interviewStatus)
        throw new Error('Candidate status update failed to persist')
      }
      
      // Log final state for debugging
      const finalState = store.getState()
      console.log('Final state - Candidates:', finalState.candidates.candidates.length)
      console.log('Final state - Interviews:', finalState.interviews.interviews.length)
      console.log('Final completed candidate:', finalState.candidates.candidates.find(c => c.id === currentInterview.candidateId))
      
      // Force a small delay to ensure state updates are persisted
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error('Error during interview completion:', error)
      message.error('Failed to complete interview properly. Please try again.')
      return
    }
    
    dispatch(pauseTimer())
    localStorage.removeItem('unfinishedInterview')
    
    console.log('Interview completion process finished successfully')
    setShowCompletionMessage(true)
  }

  const handlePauseResume = () => {
    if (timer.isRunning) {
      dispatch(pauseTimer())
    } else {
      dispatch(resumeTimer())
    }
  }

  const handleWelcomeBack = () => {
    setShowWelcomeBack(false)
    // Restore the interview state
    const unfinishedData = JSON.parse(localStorage.getItem('unfinishedInterview') || '{}')
    if (unfinishedData.candidateInfo) {
      setCandidateInfo(unfinishedData.candidateInfo)
      setCurrentStep(2)
      setIsInterviewStarted(true)
    }
  }

  const getTimeLimit = (difficulty: string): number => {
    switch (difficulty) {
      case 'easy': return 20 // 20 seconds
      case 'medium': return 60 // 60 seconds  
      case 'hard': return 120 // 120 seconds
      default: return 60
    }
  }

  const calculateOverallScore = (answers: any[]): number => {
    if (answers.length === 0) return 0
    
    const validScores = answers
      .map(answer => answer.score || 0)
      .filter(score => score > 0)
    
    if (validScores.length === 0) return 0
    
    return validScores.reduce((sum, score) => sum + score, 0) / validScores.length
  }

  const steps = [
    {
      title: 'Upload Resume',
      description: 'Upload your resume to extract information'
    },
    {
      title: 'Complete Info',
      description: 'Fill in any missing information'
    },
    {
      title: 'Start Interview',
      description: 'Begin your technical interview'
    }
  ]

  // Fullscreen completion message
  if (showCompletionMessage) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        <Card style={{ 
          width: 500, 
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: 'none'
        }}>
          <div style={{ padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px', color: '#52c41a' }}>
              ✓
            </div>
            <Title level={2} style={{ marginBottom: '16px', color: '#333' }}>
              Interview Completed!
            </Title>
            <Text style={{ 
              display: 'block', 
              marginBottom: '24px', 
              fontSize: '16px',
              color: '#666',
              lineHeight: 1.6
            }}>
              Thank you for completing the interview, {candidateInfo.name}.<br />
              <strong>Please wait for results - we will get back to you soon.</strong>
            </Text>
            <Text style={{ 
              display: 'block',
              fontSize: '14px',
              color: '#999'
            }}>
              You can safely close this window now.
            </Text>
          </div>
        </Card>
      </div>
    )
  }

  // Welcome Back Modal
  if (showWelcomeBack) {
    return (
      <Modal
        title="Welcome Back!"
        open={showWelcomeBack}
        onOk={handleWelcomeBack}
        onCancel={() => setShowWelcomeBack(false)}
        okText="Continue Interview"
        cancelText="Start Fresh"
      >
        <p>We found an unfinished interview session. Would you like to continue where you left off?</p>
      </Modal>
    )
  }

  // Step 0: Resume Upload
  if (currentStep === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: '24px' }}>
            <UserOutlined style={{ marginRight: '12px' }} />
            Welcome to Your Interview
          </Title>
          <Text style={{ display: 'block', marginBottom: '24px' }}>
            Please upload your resume to get started. We'll extract your information and begin the interview process.
          </Text>
          
          <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />
          
          <ResumeUpload onResumeProcessed={handleResumeUpload} />
        </Card>
      </div>
    )
  }

  // Step 0.5: Missing Information Collection
  if (currentStep === 0.5) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: '24px' }}>
            Complete Your Information
          </Title>
          <Text style={{ display: 'block', marginBottom: '24px' }}>
            We need a few more details before starting your interview.
            </Text>
          
          <Steps current={1} items={steps} style={{ marginBottom: '24px' }} />
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleMissingInfoSubmit}
            initialValues={candidateInfo}
          >
            {missingFields.includes('name') && (
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input placeholder="Enter your full name" />
              </Form.Item>
            )}
            
            {missingFields.includes('email') && (
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter your email address" />
              </Form.Item>
            )}
            
            {missingFields.includes('phone') && (
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter your phone number' }]}
              >
                <Input placeholder="Enter your phone number" />
              </Form.Item>
            )}
            
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                Continue to Interview
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    )
  }

  // Step 1: Interview Start
  if (currentStep === 1) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: '24px' }}>
            Ready to Start, {candidateInfo.name}?
          </Title>
          <Text style={{ display: 'block', marginBottom: '24px' }}>
            You're about to begin a 6-question technical interview for a Full Stack Developer position.
            <br />
            <strong>Format:</strong> 2 Easy (20s each) → 2 Medium (60s each) → 2 Hard (120s each)
          </Text>
          
          <Steps current={2} items={steps} style={{ marginBottom: '24px' }} />
          
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <Text strong>Your Information:</Text>
            <br />
            <Text>Name: {candidateInfo.name}</Text>
            <br />
            <Text>Email: {candidateInfo.email}</Text>
            <br />
            <Text>Phone: {candidateInfo.phone}</Text>
          </div>

          <Button 
            type="primary" 
            size="large"
            onClick={handleStartInterview}
            loading={isGeneratingQuestions}
            disabled={isGeneratingQuestions}
            block
          >
            {isGeneratingQuestions ? 'Generating Questions...' : 'Start Interview'}
          </Button>
        </Card>
      </div>
    )
  }

  // Step 2: Interview in Progress
  if (!currentInterview) {
    return (
      <Card>
        <Title level={4}>Interview not found</Title>
        <Text>Please check the interview link and try again.</Text>
      </Card>
    )
  }

  const currentQuestion = currentInterview.questions[currentInterview.currentQuestionIndex]
  const progress = ((currentInterview.currentQuestionIndex + 1) / currentInterview.questions.length) * 100

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Technical Interview</Title>
            <Text type="secondary">
              Question {currentInterview.currentQuestionIndex + 1} of {currentInterview.questions.length}
              ({currentQuestion.difficulty.toUpperCase()})
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClockCircleOutlined />
              <Text strong>{formatTime(timer.remainingTime)}</Text>
            </div>
            <Button 
              icon={timer.isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handlePauseResume}
            >
              {timer.isRunning ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>
        
        <Progress 
          percent={progress} 
          strokeColor="#52c41a"
          showInfo={false}
          style={{ marginBottom: '16px' }}
        />
        
        <InterviewProgress 
          current={currentInterview.currentQuestionIndex + 1}
          total={currentInterview.questions.length}
        />
      </Card>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <QuestionDisplay question={currentQuestion} />
          
          <AnswerInput 
            value={answer}
            onChange={setAnswer}
            placeholder="Type your answer here..."
            disabled={!timer.isRunning && timer.remainingTime > 0}
          />

          <div style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              size="large"
              icon={<SendOutlined />}
              onClick={handleSubmitAnswer}
              disabled={!answer.trim()}
            >
              Submit Answer
            </Button>
          </div>
        </Space>
      </Card>

    </div>
  )
}

export default IntervieweePage