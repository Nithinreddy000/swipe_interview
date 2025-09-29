import { Question, Answer } from '@/types/index'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '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'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'mistralai/Mistral-7B-Instruct'

export interface AnswerEvaluationResult {
  score: number
  feedback: string
  technicalAccuracy: number
  problemSolving: number
  communication: number
  timeEfficiency: number
  suggestions: string[]
}

async function callOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('Missing VITE_OPENROUTER_API_KEY')
  const resp = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert full‑stack technical interviewer. Always answer in compact JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      top_p: 0.95,
    }),
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`OpenRouter API error ${resp.status}: ${text}`)
  }
  const data = await resp.json()
  const text = data?.choices?.[0]?.message?.content || ''
  if (!text) throw new Error('OpenRouter returned empty content')
  return text
}

export async function generateQuestion(req: { 
  difficulty: 'easy'|'medium'|'hard'; 
  topic: string; 
  type: 'coding'|'technical'|'behavioral'; 
  previousQuestions?: Question[];
  candidateSkills?: string[];
  candidateRole?: string;
}): Promise<Question> {
  const difficultyMap = { easy: 'beginner-level', medium: 'intermediate-level', hard: 'advanced-level' }
  
  // Question format templates for variety
  const questionFormats = {
    easy: [
      'Explain the concept of {topic} and provide a simple example',
      'What is the difference between {topic} approaches A and B?',
      'Debug this simple code snippet related to {topic}',
      'Complete this basic {topic} implementation',
      'List the main advantages of using {topic}'
    ],
    medium: [
      'Design a solution for {topic} that handles edge case X',
      'Optimize this code for better {topic} performance',
      'Compare and contrast different {topic} strategies',
      'Implement a middleware/service for {topic}',
      'Troubleshoot this real-world {topic} scenario'
    ],
    hard: [
      'Architect a scalable system involving {topic}',
      'Analyze the trade-offs in this {topic} design decision',
      'Solve this complex {topic} performance bottleneck',
      'Design a fault-tolerant {topic} implementation',
      'Lead a team discussion on {topic} best practices'
    ]
  }
  
  const typeInstructions: Record<string, string> = {
    coding: 'Provide a coding problem requiring writing code. Include problem statement and expected approach.',
    technical: 'Ask about technical concepts, best practices, or system design.',
    behavioral: 'Ask about past experiences, teamwork, or problem-solving situations.'
  }
  // Create skill-based context for the candidate
  const skillsContext = req.candidateSkills && req.candidateSkills.length > 0 
    ? `Candidate Skills: ${req.candidateSkills.join(', ')}`
    : 'Skills not specified'
    
  const roleContext = req.candidateRole || 'Full Stack Developer'
  
  // Get random question format for variety
  const formatTemplates = questionFormats[req.difficulty]
  const selectedFormat = formatTemplates[Math.floor(Math.random() * formatTemplates.length)]
  
  // Create context about previous questions to avoid duplicates
  const previousQuestionsContext = req.previousQuestions && req.previousQuestions.length > 0
    ? `Previous Questions Asked (AVOID similar patterns): ${req.previousQuestions.map((q, i) => `${i+1}. ${q.text.substring(0, 100)}...`).join(' ')}`
    : 'No previous questions'
  
  const randomSeed = Math.random().toString(36).substring(7)
  
  const prompt = `Generate a UNIQUE ${difficultyMap[req.difficulty]} ${req.type} interview question for a ${roleContext} position about ${req.topic}.

${typeInstructions[req.type]}

CANDIDATE CONTEXT:
- ${skillsContext}
- Target Role: ${roleContext}

QUESTION FORMAT GUIDANCE:
- Use this format style as inspiration: "${selectedFormat.replace('{topic}', req.topic)}"
- But create your own unique variation

PREVIOUS QUESTIONS CONTEXT:
${previousQuestionsContext}

CRITICAL UNIQUENESS REQUIREMENTS:
- DO NOT start with "You're building..." or "You are building..."
- DO NOT use similar sentence structures to previous questions
- Vary the question approach: debugging, explaining, designing, comparing, implementing
- Make each question distinctly different in format and approach
- Focus on the specific topic: ${req.topic}
- Tailor to candidate's actual skills: ${skillsContext}

BANNED PATTERNS (DO NOT USE):
- "You're building a [technology] application that..."
- "You are working on a [project] that..."
- "Explain the difference between..."
- Generic scenario setups

RESPONSE FORMAT:
Return ONLY a valid JSON object with no additional text, markdown, or explanations.
{"question":"Your unique question text here","expectedAnswer":"Expected answer here"}`

  let text = ''
  let retryCount = 0
  const maxRetries = 3
  
  // Retry logic for API failures
  while (retryCount < maxRetries) {
    try {
      console.log(`Generating question attempt ${retryCount + 1} for topic: ${req.topic}, difficulty: ${req.difficulty}`)
      text = await callOpenRouter(prompt)
      console.log('Raw API response:', text.substring(0, 200) + '...')
      break
    } catch (error) {
      retryCount++
      console.warn(`Question generation attempt ${retryCount} failed:`, error)
      if (retryCount === maxRetries) {
        throw new Error(`Failed to generate question after ${maxRetries} attempts: ${error}`)
      }
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Try to parse the response with multiple strategies
  try {
    let clean = text.trim()
    
    // Remove markdown code blocks
    clean = clean.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '')
    
    // Try to extract JSON from text if it's mixed with other content
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      clean = jsonMatch[0]
    }
    
    // Handle common JSON formatting issues
    clean = clean.replace(/\n\s*/g, ' ').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
    
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (firstParseError) {
      // If direct parsing fails, try to find and extract the JSON object more aggressively
      const startIndex = clean.indexOf('{')
      const endIndex = clean.lastIndexOf('}')
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const jsonSubstring = clean.substring(startIndex, endIndex + 1)
        parsed = JSON.parse(jsonSubstring)
      } else {
        throw firstParseError
      }
    }
    
    // Validate the parsed object
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Parsed response is not a valid object')
    }
    
    if (!parsed.question || typeof parsed.question !== 'string' || parsed.question.trim().length === 0) {
      throw new Error('Generated question is empty or invalid')
    }
    
    const generatedQuestion = {
      id: crypto.randomUUID(),
      text: parsed.question.trim(),
      type: req.type,
      difficulty: req.difficulty,
      category: req.topic,
      timeLimit: getTimeLimit(req.difficulty),
      expectedAnswer: (parsed.expectedAnswer && typeof parsed.expectedAnswer === 'string') 
        ? parsed.expectedAnswer.trim() 
        : ''
    }
    
    console.log(`Successfully generated question: "${generatedQuestion.text.substring(0, 50)}..." for ${req.topic}`)
    return generatedQuestion
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError)
    console.error('Raw response text:', text)
    throw new Error(`Failed to parse question generation response: ${parseError}`)
  }
}

export async function evaluateAnswer(
  question: Question,
  answer: Answer,
  candidateName: string
): Promise<AnswerEvaluationResult> {
  const prompt = `Evaluate this interview answer.
Question: ${question.text}
Answer: ${answer.text}
Candidate: ${candidateName}
Provide strict numeric evaluation JSON only:
{"overallScore":0-100,"technicalAccuracy":0-100,"problemSolving":0-100,"communication":0-100,"timeEfficiency":0-100,"feedback":"...","suggestions":["..."]}`

  let text = ''
  let retryCount = 0
  const maxRetries = 3
  
  // Retry logic for API failures
  while (retryCount < maxRetries) {
    try {
      text = await callOpenRouter(prompt)
      break
    } catch (error) {
      retryCount++
      console.warn(`Answer evaluation attempt ${retryCount} failed:`, error)
      if (retryCount === maxRetries) {
        throw new Error(`Failed to evaluate answer after ${maxRetries} attempts: ${error}`)
      }
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Try to parse the response with robust JSON extraction
  try {
    let clean = text.trim()
    
    // Remove markdown code blocks
    clean = clean.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '')
    
    // Try to extract JSON from text if it's mixed with other content
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      clean = jsonMatch[0]
    }
    
    // Handle common JSON formatting issues
    clean = clean.replace(/\n\s*/g, ' ').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
    
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (firstParseError) {
      // If direct parsing fails, try to find and extract the JSON object more aggressively
      const startIndex = clean.indexOf('{')
      const endIndex = clean.lastIndexOf('}')
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const jsonSubstring = clean.substring(startIndex, endIndex + 1)
        parsed = JSON.parse(jsonSubstring)
      } else {
        throw firstParseError
      }
    }
    
    // Validate that all required fields are present and are numbers
    const requiredNumericFields = ['overallScore', 'technicalAccuracy', 'problemSolving', 'communication', 'timeEfficiency']
    for (const field of requiredNumericFields) {
      if (typeof parsed[field] !== 'number' || parsed[field] < 0 || parsed[field] > 100) {
        throw new Error(`Invalid or missing ${field} in evaluation response`)
      }
    }
    
    if (!parsed.feedback || typeof parsed.feedback !== 'string' || parsed.feedback.trim().length === 0) {
      throw new Error('Invalid or missing feedback in evaluation response')
    }
    
    if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
      throw new Error('Invalid or missing suggestions in evaluation response')
    }
    
    return {
      score: parsed.overallScore,
      feedback: parsed.feedback,
      technicalAccuracy: parsed.technicalAccuracy,
      problemSolving: parsed.problemSolving,
      communication: parsed.communication,
      timeEfficiency: parsed.timeEfficiency,
      suggestions: parsed.suggestions
    }
  } catch (parseError) {
    console.error('Failed to parse evaluation response:', parseError)
    throw new Error(`Failed to parse answer evaluation response: ${parseError}`)
  }
}

export async function generateInterviewSummary(
  candidateName: string,
  questions: Question[],
  answers: Answer[],
  overallScore: number
): Promise<string> {
  const pairs = questions.map(q => {
    const a = answers.find(x => x.questionId === q.id)
    return `Q: ${q.text}\nA: ${a?.text || ''}`
  }).join('\n\n')

  const prompt = `Create a concise professional interview summary for ${candidateName} (300-500 words).
Overall Score: ${Math.round(overallScore * 100)}%
${pairs}`

  const text = await callOpenRouter(prompt)
  return text.replace(/```[\s\S]*?```/g, '').trim()
}

function getTimeLimit(difficulty: string): number {
  switch (difficulty) {
    case 'easy': return 20
    case 'medium': return 60
    case 'hard': return 120
    default: return 60
  }
}