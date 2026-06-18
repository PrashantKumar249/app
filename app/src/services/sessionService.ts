import type { AnswerChoice, Session } from '../types'
import { db } from '../database/db'
import { createId } from '../utils/id'
import { classifyDifficulty } from '../utils/difficulty'
import {
  getCorrectAnswer,
  getNextAttemptNumber,
} from './analyticsService'
import { removeMistakeIfCorrect, syncMistake } from './mistakeService'

export async function getActiveOrPausedSession(topicId: string): Promise<Session | undefined> {
  return db.sessions
    .where('[topicId+status]')
    .anyOf([
      [topicId, 'active'],
      [topicId, 'paused'],
    ])
    .first()
}

export async function startSession(topicId: string): Promise<Session> {
  const existing = await getActiveOrPausedSession(topicId)
  if (existing) {
    throw new Error('An active or paused session already exists for this topic')
  }

  const session: Session = {
    id: createId(),
    topicId,
    startedAt: new Date().toISOString(),
    currentQuestion: 1,
    lastSequentialQuestion: 1,
    totalTimeSpent: 0,
    status: 'active',
    navigationMode: 'sequential',
    activeQuestionNumber: 1,
    activeQuestionElapsedMs: 0,
    activeQuestionStartedAt: new Date().toISOString(),
  }

  await db.sessions.add(session)
  return session
}

export async function resumeSession(sessionId: string): Promise<Session> {
  const session = await db.sessions.get(sessionId)
  if (!session) throw new Error('Session not found')
  if (session.status === 'completed') throw new Error('Session already completed')

  const updated: Session = {
    ...session,
    status: 'active',
    activeQuestionNumber: session.currentQuestion,
    activeQuestionStartedAt: new Date().toISOString(),
  }

  await db.sessions.put(updated)
  return updated
}

export async function pauseSession(sessionId: string, elapsedMs: number): Promise<Session> {
  const session = await db.sessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  const updated: Session = {
    ...session,
    status: 'paused',
    activeQuestionElapsedMs: elapsedMs,
    activeQuestionStartedAt: undefined,
  }

  await db.sessions.put(updated)
  return updated
}

export async function endSession(sessionId: string, elapsedMs: number): Promise<Session> {
  const session = await db.sessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  const updated: Session = {
    ...session,
    status: 'completed',
    endedAt: new Date().toISOString(),
    activeQuestionElapsedMs: elapsedMs,
    activeQuestionStartedAt: undefined,
  }

  await db.sessions.put(updated)
  return updated
}

export async function navigateToQuestion(
  sessionId: string,
  questionNumber: number,
  mode: 'sequential' | 'jump',
  elapsedMs: number,
): Promise<Session> {
  const session = await db.sessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  const updated: Session = {
    ...session,
    currentQuestion: questionNumber,
    navigationMode: mode,
    activeQuestionNumber: questionNumber,
    activeQuestionElapsedMs: elapsedMs,
    activeQuestionStartedAt: new Date().toISOString(),
    ...(mode === 'sequential' ? { lastSequentialQuestion: questionNumber } : {}),
  }

  await db.sessions.put(updated)
  return updated
}

export async function persistTimerState(
  sessionId: string,
  elapsedMs: number,
  isRunning: boolean,
): Promise<void> {
  const session = await db.sessions.get(sessionId)
  if (!session || session.status === 'completed') return

  await db.sessions.update(sessionId, {
    activeQuestionElapsedMs: elapsedMs,
    activeQuestionStartedAt: isRunning ? new Date().toISOString() : undefined,
  })
}

export interface SubmitAnswerResult {
  session: Session
  isCorrect: boolean
  correctAnswer: AnswerChoice
  nextQuestion?: number
}

export async function submitAnswer(
  sessionId: string,
  selectedAnswer: AnswerChoice,
  timeTakenMs: number,
): Promise<SubmitAnswerResult> {
  const session = await db.sessions.get(sessionId)
  if (!session) throw new Error('Session not found')
  if (session.status === 'completed') throw new Error('Session already completed')

  const topic = await db.topics.get(session.topicId)
  if (!topic) throw new Error('Topic not found')

  const questionNumber = session.currentQuestion
  const correctAnswer = getCorrectAnswer(topic, questionNumber)
  if (!correctAnswer) {
    throw new Error('Answer key not configured for this question')
  }

  const isCorrect = selectedAnswer === correctAnswer
  const attemptNumber = await getNextAttemptNumber(session.topicId, questionNumber)

  await db.answers.add({
    id: createId(),
    sessionId,
    topicId: session.topicId,
    questionNumber,
    attemptNumber,
    selectedAnswer,
    correctAnswer,
    isCorrect,
    timeTaken: timeTakenMs,
    difficulty: classifyDifficulty(timeTakenMs),
    createdAt: new Date().toISOString(),
  })

  if (isCorrect) {
    await removeMistakeIfCorrect(session.topicId, questionNumber)
  } else {
    await syncMistake(session.topicId, questionNumber, selectedAnswer, correctAnswer)
  }

  const shouldAdvance = session.navigationMode === 'sequential'
  const nextQuestion = shouldAdvance ? questionNumber + 1 : questionNumber
  const canAdvance = shouldAdvance && nextQuestion <= topic.totalQuestions

  const updated: Session = {
    ...session,
    totalTimeSpent: session.totalTimeSpent + timeTakenMs,
    currentQuestion: canAdvance ? nextQuestion : questionNumber,
    lastSequentialQuestion: canAdvance ? nextQuestion : session.lastSequentialQuestion,
    navigationMode: canAdvance ? 'sequential' : session.navigationMode,
    activeQuestionNumber: canAdvance ? nextQuestion : questionNumber,
    activeQuestionElapsedMs: 0,
    activeQuestionStartedAt: canAdvance ? new Date().toISOString() : undefined,
  }

  await db.sessions.put(updated)

  return {
    session: updated,
    isCorrect,
    correctAnswer,
    nextQuestion: canAdvance ? nextQuestion : undefined,
  }
}

export async function getSessionsForTopic(topicId: string): Promise<Session[]> {
  return db.sessions.where('topicId').equals(topicId).reverse().sortBy('startedAt')
}

export async function getSessionAnswers(sessionId: string) {
  return db.answers.where('sessionId').equals(sessionId).toArray()
}

export function computeElapsedMs(session: Session): number {
  let elapsed = session.activeQuestionElapsedMs
  if (session.activeQuestionStartedAt) {
    elapsed += Date.now() - new Date(session.activeQuestionStartedAt).getTime()
  }
  return elapsed
}
