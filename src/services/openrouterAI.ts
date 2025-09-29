import { Question, Answer } from '@/types/index'

const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface AnswerEvaluationResult {
  score: number
  feedback: string
  technicalAccuracy: number
  problemSolving: number
  communication: number
  timeEfficiency: number
  suggestions: string[]
}

export async function evaluateAnswer(
  question: Question,
  answer: Answer,
  candidateName: string
): Promise<AnswerEvaluationResult> {
  const prompt = `Evaluate the following answer for the interview question.\nQuestion: ${question.text}\nAnswer: ${answer.text}\nCandidate: ${candidateName}\nScoring rules:\n- If the answer is empty, irrelevant, or just 'yes'/'no', give a score of 0.\n- If the answer is fully correct, give 100.\n- If the answer is partially correct, give 50.\n- Be strict.\nProvide a score (0-100), feedback, technical accuracy, problem solving, communication, time efficiency (all 0-100), and improvement suggestions as a JSON object. Only output JSON.`;
  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistralai/Mistral-7B-Instruct',
      messages: [
        { role: 'system', content: 'You are an expert technical interviewer and answer evaluator. Always reply in JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 256
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }
  const data = await response.json();
  // Try to parse the model's response as JSON
  let parsed;
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch {
    parsed = {};
  }
  return {
    score: parsed.score || 0,
    feedback: parsed.feedback || '',
    technicalAccuracy: parsed.technicalAccuracy || 0,
    problemSolving: parsed.problemSolving || 0,
    communication: parsed.communication || 0,
    timeEfficiency: parsed.timeEfficiency || 0,
    suggestions: parsed.suggestions || []
  };
}
