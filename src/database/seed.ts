import { createId } from '../utils/id'
import { db, getDefaultBook } from './db'

const SEED_KEY = 'pinnacle-seeded'

export async function seedDatabaseIfNeeded(): Promise<void> {
  const existing = await db.meta.get(SEED_KEY)
  if (existing) return

  const topicCount = await db.topics.count()
  if (topicCount > 0) {
    await db.meta.put({ key: SEED_KEY, value: 'true' })
    return
  }

  const { PINNACLE_REASONING_TOPICS } = await import('../data/pinnacle-reasoning.seed')
  const book = await getDefaultBook()
  const now = new Date().toISOString()

  await db.transaction('rw', db.topics, db.meta, async () => {
    const seeded = await db.meta.get(SEED_KEY)
    if (seeded) return

    const count = await db.topics.count()
    if (count > 0) {
      await db.meta.put({ key: SEED_KEY, value: 'true' })
      return
    }

    await db.topics.bulkAdd(
      PINNACLE_REASONING_TOPICS.map((seed) => ({
        id: createId(),
        bookId: book.id,
        name: seed.name,
        totalQuestions: seed.totalQuestions,
        startPage: seed.startPage,
        endPage: seed.endPage,
        answerKey: seed.answerKey,
        createdAt: now,
      })),
    )

    await db.meta.put({ key: SEED_KEY, value: 'true' })
  })
}
