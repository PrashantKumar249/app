import type { Answer, AnswerChoice, Difficulty, SessionAnswerReview, SessionSummary, Topic } from '../types'
import { db } from '../database/db'

export async function getLatestAttemptsForTopic(topicId: string): Promise<Map<number, Answer>> {
  const answers = await db.answers.where('topicId').equals(topicId).sortBy('createdAt')
  const latest = new Map<number, Answer>()

  for (const answer of answers) {
    latest.set(answer.questionNumber, answer)
  }

  return latest
}

export async function getLatestAttemptsForAllTopics(): Promise<Map<string, Map<number, Answer>>> {
  const answers = await db.answers.orderBy('createdAt').toArray()
  const byTopic = new Map<string, Map<number, Answer>>()

  for (const answer of answers) {
    if (!byTopic.has(answer.topicId)) {
      byTopic.set(answer.topicId, new Map())
    }
    byTopic.get(answer.topicId)!.set(answer.questionNumber, answer)
  }

  return byTopic
}

export async function getNextAttemptNumber(
  topicId: string,
  questionNumber: number,
): Promise<number> {
  const existing = await db.answers
    .where('[topicId+questionNumber]')
    .equals([topicId, questionNumber])
    .toArray()

  if (existing.length === 0) return 1
  return Math.max(...existing.map((a) => a.attemptNumber)) + 1
}

export async function getTopicStats(topic: Topic) {
  const latest = await getLatestAttemptsForTopic(topic.id)
  const attempts = Array.from(latest.values())

  const difficultyDistribution: Record<Difficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    'very-hard': 0,
  }

  let correct = 0
  let totalTime = 0

  for (const attempt of attempts) {
    if (attempt.isCorrect) correct++
    totalTime += attempt.timeTaken
    difficultyDistribution[attempt.difficulty]++
  }

  const questionsSolved = attempts.length
  const accuracy = questionsSolved > 0 ? (correct / questionsSolved) * 100 : 0
  const averageTimeMs = questionsSolved > 0 ? totalTime / questionsSolved : 0
  const isCompleted = questionsSolved >= topic.totalQuestions

  return {
    topicId: topic.id,
    questionsSolved,
    questionsRemaining: topic.totalQuestions - questionsSolved,
    accuracy,
    averageTimeMs,
    difficultyDistribution,
    isCompleted,
  }
}

export async function getDashboardStats() {
  const topics = await db.topics.toArray()
  const latestByTopic = await getLatestAttemptsForAllTopics()

  let totalQuestionsSolved = 0
  let totalCorrect = 0
  let totalWrong = 0
  let totalTime = 0
  let topicsCompleted = 0

  for (const topic of topics) {
    const latest = latestByTopic.get(topic.id) ?? new Map()
    const attempts = Array.from(latest.values())
    totalQuestionsSolved += attempts.length

    for (const attempt of attempts) {
      if (attempt.isCorrect) totalCorrect++
      else totalWrong++
      totalTime += attempt.timeTaken
    }

    if (attempts.length >= topic.totalQuestions) {
      topicsCompleted++
    }
  }

  const overallAccuracy =
    totalQuestionsSolved > 0 ? (totalCorrect / totalQuestionsSolved) * 100 : 0
  const averageTimeMs = totalQuestionsSolved > 0 ? totalTime / totalQuestionsSolved : 0

  return {
    totalQuestionsSolved,
    totalCorrect,
    totalWrong,
    overallAccuracy,
    averageTimeMs,
    topicsCompleted,
    totalTopics: topics.length,
  }
}

export async function getSessionSummary(sessionId: string): Promise<SessionSummary> {
  const session = await db.sessions.get(sessionId)
  if (!session) {
    return { attempted: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0, totalTimeSpent: 0 }
  }

  const topic = await db.topics.get(session.topicId)
  const answers = await db.answers.where('sessionId').equals(sessionId).toArray()
  const latestByQuestion = new Map<number, Answer>()

  for (const answer of answers) {
    latestByQuestion.set(answer.questionNumber, answer)
  }

  let correct = 0
  let wrong = 0
  let totalTime = 0

  for (const answer of latestByQuestion.values()) {
    if (answer.isCorrect) correct++
    else wrong++
    totalTime += answer.timeTaken
  }

  const attempted = latestByQuestion.size
  const unattempted = topic ? topic.totalQuestions - attempted : 0
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0

  return {
    attempted,
    correct,
    wrong,
    unattempted,
    accuracy,
    totalTimeSpent: totalTime,
  }
}

export async function getSessionAnswerReview(sessionId: string): Promise<SessionAnswerReview[]> {
  const answers = await db.answers.where('sessionId').equals(sessionId).sortBy('createdAt')
  const latestByQuestion = new Map<number, Answer>()

  for (const answer of answers) {
    latestByQuestion.set(answer.questionNumber, answer)
  }

  return Array.from(latestByQuestion.values())
    .sort((a, b) => a.questionNumber - b.questionNumber)
    .map((answer) => ({
      questionNumber: answer.questionNumber,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: answer.correctAnswer,
      isCorrect: answer.isCorrect,
      timeTaken: answer.timeTaken,
    }))
}

export async function getDailyStats(days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffIso = cutoff.toISOString()

  const answers = await db.answers.where('createdAt').above(cutoffIso).toArray()
  const byDate = new Map<string, { attempted: number; correct: number; wrong: number }>()

  for (const answer of answers) {
    const date = answer.createdAt.slice(0, 10)
    if (!byDate.has(date)) {
      byDate.set(date, { attempted: 0, correct: 0, wrong: 0 })
    }
    const bucket = byDate.get(date)!
    bucket.attempted++
    if (answer.isCorrect) bucket.correct++
    else bucket.wrong++
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      attempted: stats.attempted,
      correct: stats.correct,
      wrong: stats.wrong,
      accuracy: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0,
    }))
}

export async function getWeeklyStats(weeks = 12) {
  const answers = await db.answers.orderBy('createdAt').toArray()
  const byWeek = new Map<string, { attempted: number; correct: number; wrong: number }>()

  for (const answer of answers) {
    const date = new Date(answer.createdAt)
    const weekStart = getWeekStart(date)
    const key = weekStart.toISOString().slice(0, 10)
    if (!byWeek.has(key)) {
      byWeek.set(key, { attempted: 0, correct: 0, wrong: 0 })
    }
    const bucket = byWeek.get(key)!
    bucket.attempted++
    if (answer.isCorrect) bucket.correct++
    else bucket.wrong++
  }

  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-weeks)
    .map(([date, stats]) => ({
      date,
      attempted: stats.attempted,
      correct: stats.correct,
      wrong: stats.wrong,
      accuracy: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0,
    }))
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getCorrectAnswer(
  topic: Topic,
  questionNumber: number,
): AnswerChoice | null {
  const index = questionNumber - 1
  const key = topic.answerKey[index]
  if (!key || !['A', 'B', 'C', 'D'].includes(key.toUpperCase())) {
    return null
  }
  return key.toUpperCase() as AnswerChoice
}
