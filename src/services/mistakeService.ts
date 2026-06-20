import type { AnswerChoice } from '../types'
import { db } from '../database/db'
import { createId } from '../utils/id'

export async function syncMistake(
  topicId: string,
  questionNumber: number,
  selectedAnswer: AnswerChoice,
  correctAnswer: AnswerChoice,
): Promise<void> {
  const existing = await db.mistakes
    .where('[topicId+questionNumber]')
    .equals([topicId, questionNumber])
    .first()

  const now = new Date().toISOString()

  if (existing) {
    await db.mistakes.update(existing.id, {
      selectedAnswer,
      correctAnswer,
      occurrenceCount: existing.occurrenceCount + 1,
      lastSeen: now,
    })
  } else {
    await db.mistakes.add({
      id: createId(),
      topicId,
      questionNumber,
      selectedAnswer,
      correctAnswer,
      occurrenceCount: 1,
      lastSeen: now,
    })
  }
}

export async function removeMistakeIfCorrect(
  topicId: string,
  questionNumber: number,
): Promise<void> {
  const existing = await db.mistakes
    .where('[topicId+questionNumber]')
    .equals([topicId, questionNumber])
    .first()

  if (existing) {
    await db.mistakes.delete(existing.id)
  }
}

export async function getMistakesByTopic(topicId?: string) {
  if (topicId) {
    return db.mistakes.where('topicId').equals(topicId).reverse().sortBy('lastSeen')
  }
  return db.mistakes.orderBy('lastSeen').reverse().toArray()
}
