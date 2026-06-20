import { db } from '../database/db'
import { seedDatabaseIfNeeded } from '../database/seed'

/** Clear sessions, answers, and mistakes for one topic. Keeps topic metadata and answer key. */
export async function resetTopicProgress(topicId: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.answers, db.mistakes], async () => {
    await db.answers.where('topicId').equals(topicId).delete()
    await db.sessions.where('topicId').equals(topicId).delete()
    await db.mistakes.where('topicId').equals(topicId).delete()
  })
}

/** Clear all practice data. Keeps topic list and answer keys. */
export async function resetAllProgress(): Promise<void> {
  await db.transaction('rw', [db.sessions, db.answers, db.mistakes], async () => {
    await db.answers.clear()
    await db.sessions.clear()
    await db.mistakes.clear()
  })
}

/** Wipe everything including topics and books, then re-seed default topics. */
export async function resetEntireApp(): Promise<void> {
  await db.transaction(
    'rw',
    [db.books, db.topics, db.sessions, db.answers, db.mistakes, db.meta],
    async () => {
      await db.answers.clear()
      await db.sessions.clear()
      await db.mistakes.clear()
      await db.topics.clear()
      await db.books.clear()
      await db.meta.clear()
    },
  )

  await seedDatabaseIfNeeded()
}