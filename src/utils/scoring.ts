import { Answer, Question } from '@/types/index'
import { calculateTextSimilarity } from './algorithms';

export interface ScoringCriteria {
  accuracy: number;
  completeness: number;
  clarity: number;
  timeliness: number;
  relevance: number;
}

export interface ScoringWeights {
  accuracy: number;
  completeness: number;
  clarity: number;
  timeliness: number;
  relevance: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  accuracy: 0.3,
  completeness: 0.25,
  clarity: 0.2,
  timeliness: 0.15,
  relevance: 0.1,
};

export function calculateAnswerScore(
  answer: Answer,
  question: Question,
  expectedAnswer?: string,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const criteria = evaluateAnswerCriteria(answer, question, expectedAnswer);
  
  return Object.keys(criteria).reduce((total, key) => {
    const criterion = key as keyof ScoringCriteria;
    return total + (criteria[criterion] * weights[criterion]);
  }, 0);
}

function evaluateAnswerCriteria(
  answer: Answer,
  question: Question,
  expectedAnswer?: string
): ScoringCriteria {
  const accuracy = expectedAnswer 
    ? calculateTextSimilarity(answer.text, expectedAnswer)
    : evaluateAccuracyByKeywords(answer.text, question);
  
  const completeness = evaluateCompleteness(answer.text, question);
  const clarity = evaluateClarity(answer.text);
  const timeliness = evaluateTimeliness(answer.timeSpent, question.timeLimit);
  const relevance = evaluateRelevance(answer.text, question);

  return {
    accuracy: Math.max(0, Math.min(1, accuracy)),
    completeness: Math.max(0, Math.min(1, completeness)),
    clarity: Math.max(0, Math.min(1, clarity)),
    timeliness: Math.max(0, Math.min(1, timeliness)),
    relevance: Math.max(0, Math.min(1, relevance)),
  };
}

function evaluateAccuracyByKeywords(answer: string, question: Question): number {
  const keywords = extractKeywords(question.text, question.category);
  const answerWords = answer.toLowerCase().split(/\s+/);
  
  const matchedKeywords = keywords.filter(keyword => 
    answerWords.some(word => word.includes(keyword.toLowerCase()))
  );
  
  return keywords.length > 0 ? matchedKeywords.length / keywords.length : 0.5;
}

function extractKeywords(questionText: string, category: string): string[] {
  const categoryKeywords: Record<string, string[]> = {
    'JavaScript': ['function', 'variable', 'const', 'let', 'var', 'scope', 'closure', 'async', 'promise'],
    'Programming': ['algorithm', 'complexity', 'data structure', 'array', 'string', 'loop', 'recursion'],
    'Experience': ['project', 'team', 'challenge', 'solution', 'collaborate', 'learn', 'achieve'],
  };
  
  return categoryKeywords[category] || [];
}

function evaluateCompleteness(answer: string, question: Question): number {
  const wordCount = answer.trim().split(/\s+/).length;
  const expectedLength = question.type === 'coding' ? 50 : 
                        question.type === 'technical' ? 30 : 40;
  
  if (wordCount < expectedLength * 0.5) return 0.3;
  if (wordCount < expectedLength) return 0.7;
  if (wordCount <= expectedLength * 1.5) return 1.0;
  return 0.8;
}

function evaluateClarity(answer: string): number {
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  const avgSentenceLength = answer.length / sentences.length;
  const hasStructure = /\b(first|second|third|firstly|secondly|finally|however|therefore|because)\b/i.test(answer);
  
  let score = 0.5;
  
  if (avgSentenceLength > 20 && avgSentenceLength < 100) score += 0.3;
  if (hasStructure) score += 0.2;
  
  return Math.min(1, score);
}

function evaluateTimeliness(timeSpent: number, timeLimit: number): number {
  const ratio = timeSpent / timeLimit;
  
  if (ratio <= 0.7) return 1.0;
  if (ratio <= 1.0) return 0.8;
  if (ratio <= 1.2) return 0.5;
  return 0.2;
}

function evaluateRelevance(answer: string, question: Question): number {
  const questionWords = question.text.toLowerCase().split(/\s+/);
  const answerWords = answer.toLowerCase().split(/\s+/);
  
  const relevantWords = questionWords.filter(word => 
    word.length > 3 && answerWords.includes(word)
  );
  
  return questionWords.length > 0 ? relevantWords.length / questionWords.length : 0.5;
}

export function calculateInterviewScore(answers: Answer[], questions: Question[]): number {
  if (answers.length === 0) return 0;
  
  const totalScore = answers.reduce((sum, answer) => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return sum;
    
    const score = calculateAnswerScore(answer, question);
    return sum + score;
  }, 0);
  
  return totalScore / answers.length;
}

export function generateFeedback(
  answer: Answer,
  question: Question,
  criteria: ScoringCriteria
): string {
  const feedback: string[] = [];
  
  if (criteria.accuracy < 0.6) {
    feedback.push("Consider reviewing the key concepts related to this question.");
  }
  
  if (criteria.completeness < 0.6) {
    feedback.push("Your answer could be more comprehensive. Try to cover all aspects of the question.");
  }
  
  if (criteria.clarity < 0.6) {
    feedback.push("Work on structuring your answer more clearly with logical flow.");
  }
  
  if (criteria.timeliness < 0.6) {
    feedback.push("Try to manage your time better and provide a complete answer within the time limit.");
  }
  
  if (criteria.relevance < 0.6) {
    feedback.push("Ensure your answer directly addresses the question asked.");
  }
  
  if (feedback.length === 0) {
    feedback.push("Great answer! You demonstrated good understanding and communication skills.");
  }
  
  return feedback.join(" ");
}