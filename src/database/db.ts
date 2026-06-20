import Dexie, { type EntityTable } from 'dexie'
import type { Answer, Book, Mistake, Session, Topic } from '../types'
import { createId } from '../utils/id'

export const DEFAULT_BOOK_NAME = 'Pinnacle SSC Reasoning'

export class SSCDatabase extends Dexie {
  books!: EntityTable<Book, 'id'>
  topics!: EntityTable<Topic, 'id'>
  sessions!: EntityTable<Session, 'id'>
  answers!: EntityTable<Answer, 'id'>
  mistakes!: EntityTable<Mistake, 'id'>
  meta!: EntityTable<{ key: string; value: string }, 'key'>

  constructor() {
    super('ssc-practice-tracker')

    this.version(1).stores({
      topics: 'id, name, createdAt',
      sessions: 'id, topicId, status, startedAt, [topicId+status]',
      answers:
        'id, sessionId, topicId, questionNumber, attemptNumber, createdAt, [topicId+questionNumber], [sessionId+questionNumber]',
      mistakes: 'id, topicId, questionNumber, lastSeen, [topicId+questionNumber]',
      meta: 'key',
    })

    this.version(2)
      .stores({
        books: 'id, name, createdAt',
        topics: 'id, bookId, name, createdAt',
        sessions: 'id, topicId, status, startedAt, [topicId+status]',
        answers:
          'id, sessionId, topicId, questionNumber, attemptNumber, createdAt, [topicId+questionNumber], [sessionId+questionNumber]',
        mistakes: 'id, topicId, questionNumber, lastSeen, [topicId+questionNumber]',
        meta: 'key',
      })
      .upgrade(async (tx) => {
        const books = tx.table<Book, string>('books')
        const topics = tx.table('topics')

        let book = await books.toCollection().first()
        if (!book) {
          const bookId = createId()
          await books.add({
            id: bookId,
            name: DEFAULT_BOOK_NAME,
            createdAt: new Date().toISOString(),
          })
          book = await books.get(bookId)
        }

        if (!book) return

        const allTopics = await topics.toArray()
        for (const topic of allTopics) {
          const legacy = topic as { id: string; bookId?: string }
          if (!legacy.bookId) {
            await topics.update(legacy.id, { bookId: book.id })
          }
        }
      })
  }
}

export const db = new SSCDatabase()

export async function getDefaultBook(): Promise<Book> {
  const existing = await db.books.toCollection().first()
  if (existing) return existing

  const book: Book = {
    id: createId(),
    name: DEFAULT_BOOK_NAME,
    createdAt: new Date().toISOString(),
  }
  await db.books.add(book)
  return book
}
