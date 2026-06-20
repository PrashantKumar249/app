export type AnswerChoice = 'A' | 'B' | 'C' | 'D'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'very-hard'
export type SessionStatus = 'active' | 'paused' | 'completed'
export type NavigationMode = 'sequential' | 'jump'

export interface Book {
  id: string
  name: string
  createdAt: string
}

export interface Topic {
  id: string
  bookId: string
  name: string
  totalQuestions: number
  firstQuestionNumber?: number
  startPage?: number
  endPage?: number
  answerKey: string[]
  createdAt: string
}

export interface Session {
  id: string
  topicId: string
  startedAt: string
  endedAt?: string
  currentQuestion: number
  lastSequentialQuestion: number
  totalTimeSpent: number
  status: SessionStatus
  navigationMode: NavigationMode
  activeQuestionNumber?: number
  activeQuestionElapsedMs: number
  activeQuestionStartedAt?: string
}

export interface Answer {
  id: string
  sessionId: string
  topicId: string
  questionNumber: number
  attemptNumber: number
  selectedAnswer: AnswerChoice
  correctAnswer: AnswerChoice
  isCorrect: boolean
  timeTaken: number
  difficulty: Difficulty
  createdAt: string
}

export interface Mistake {
  id: string
  topicId: string
  questionNumber: number
  selectedAnswer: string
  correctAnswer: string
  occurrenceCount: number
  lastSeen: string
}

export interface SessionSummary {
  attempted: number
  correct: number
  wrong: number
  unattempted: number
  accuracy: number
  totalTimeSpent: number
}

export interface SessionAnswerReview {
  questionNumber: number
  selectedAnswer: AnswerChoice
  correctAnswer: AnswerChoice
  isCorrect: boolean
  timeTaken: number
}

export interface TopicStats {
  topicId: string
  questionsSolved: number
  questionsRemaining: number
  accuracy: number
  averageTimeMs: number
  difficultyDistribution: Record<Difficulty, number>
  isCompleted: boolean
}

export interface DashboardStats {
  totalQuestionsSolved: number
  totalCorrect: number
  totalWrong: number
  overallAccuracy: number
  averageTimeMs: number
  topicsCompleted: number
  totalTopics: number
}

export interface DailyStats {
  date: string
  attempted: number
  correct: number
  wrong: number
  accuracy: number
}

export interface TopicFormData {
  name: string
  totalQuestions: number
  startPage?: number
  endPage?: number
}
