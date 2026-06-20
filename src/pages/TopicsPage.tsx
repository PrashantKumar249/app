import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdvancedFilters, type FilterChip } from '../components/filters/AdvancedFilters'
import { ProgressBar } from '../components/dashboard/ProgressBar'
import { TopicForm, formatPageRange } from '../components/topics/TopicForm'
import { db, getDefaultBook } from '../database/db'
import { getTopicStats } from '../services/analyticsService'
import { createId } from '../utils/id'
import type { Book, Topic, TopicFormData } from '../types'

interface TopicRow extends Topic {
  solved: number
  hasAnswerKey: boolean
  isCompleted: boolean
}

const TOPIC_FILTER_CHIPS: FilterChip[] = [
  { id: 'key:all', label: 'All keys', group: 'Answer key' },
  { id: 'key:configured', label: 'Key configured', group: 'Answer key' },
  { id: 'key:missing', label: 'Missing key', group: 'Answer key' },
  { id: 'progress:all', label: 'Any progress', group: 'Progress' },
  { id: 'progress:not-started', label: 'Not started', group: 'Progress' },
  { id: 'progress:in-progress', label: 'In progress', group: 'Progress' },
  { id: 'progress:completed', label: 'Completed', group: 'Progress' },
]

function getActiveFilter(activeIds: string[], group: string, fallback: string): string {
  const match = activeIds.find((id) => id.startsWith(`${group}:`))
  return match?.split(':')[1] ?? fallback
}

export function TopicsPage() {
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [book, setBook] = useState<Book | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const load = async () => {
    const defaultBook = await getDefaultBook()
    setBook(defaultBook)

    const all = await db.topics.where('bookId').equals(defaultBook.id).sortBy('name')
    const rows: TopicRow[] = []
    for (const topic of all) {
      const stats = await getTopicStats(topic)
      rows.push({
        ...topic,
        solved: stats.questionsSolved,
        hasAnswerKey: topic.answerKey.length === topic.totalQuestions,
        isCompleted: stats.isCompleted,
      })
    }
    setTopics(rows)
  }

  useEffect(() => {
    load()
  }, [])

  const filteredTopics = useMemo(() => {
    const keyFilter = getActiveFilter(activeFilters, 'key', 'all')
    const progressFilter = getActiveFilter(activeFilters, 'progress', 'all')
    const query = search.trim().toLowerCase()

    return topics.filter((topic) => {
      if (query && !topic.name.toLowerCase().includes(query)) return false
      if (keyFilter === 'configured' && !topic.hasAnswerKey) return false
      if (keyFilter === 'missing' && topic.hasAnswerKey) return false
      if (progressFilter === 'not-started' && topic.solved > 0) return false
      if (progressFilter === 'in-progress' && (topic.solved === 0 || topic.isCompleted)) return false
      if (progressFilter === 'completed' && !topic.isCompleted) return false
      return true
    })
  }, [topics, activeFilters, search])

  const handleCreate = async (data: TopicFormData) => {
    const defaultBook = await getDefaultBook()
    await db.topics.add({
      id: createId(),
      bookId: defaultBook.id,
      name: data.name,
      totalQuestions: data.totalQuestions,
      startPage: data.startPage,
      endPage: data.endPage,
      answerKey: [],
      createdAt: new Date().toISOString(),
    })
    setShowForm(false)
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Topics</h1>
          <p className="text-sm text-muted">
            {book?.name ?? 'Loading...'} · {filteredTopics.length}/{topics.length} shown
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search topics..."
        className="w-full rounded-lg border border-app px-3 py-2 text-sm"
      />

      <AdvancedFilters
        chips={TOPIC_FILTER_CHIPS}
        activeIds={activeFilters}
        onChange={setActiveFilters}
        title="Filter topics"
      />

      {showForm && (
        <div className="rounded-xl border border-app bg-surface p-4">
          <TopicForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="space-y-3">
        {filteredTopics.length === 0 ? (
          <p className="text-center text-sm text-muted">No topics match your filters.</p>
        ) : (
          filteredTopics.map((topic) => {
            const pageRange = formatPageRange(topic)
            return (
              <Link
                key={topic.id}
                to={`/topics/${topic.id}`}
                className="block rounded-xl border border-app bg-surface p-4 transition-colors hover:bg-surface-elevated"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{topic.name}</span>
                  <div className="flex items-center gap-2">
                    {!topic.hasAnswerKey && (
                      <span className="rounded bg-warning-soft px-2 py-0.5 text-xs text-warning">
                        No key
                      </span>
                    )}
                    <span className="text-xs text-muted">{topic.totalQuestions} Qs</span>
                  </div>
                </div>
                {pageRange && <p className="mb-2 text-xs text-faint">{pageRange}</p>}
                <ProgressBar value={topic.solved} max={topic.totalQuestions} />
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
