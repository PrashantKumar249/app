import { useState } from 'react'
import type { Topic, TopicFormData } from '../../types'

interface TopicFormProps {
  topic?: Topic
  onSave: (data: TopicFormData) => Promise<void>
  onCancel: () => void
}

export function TopicForm({ topic, onSave, onCancel }: TopicFormProps) {
  const [name, setName] = useState(topic?.name ?? '')
  const [totalQuestions, setTotalQuestions] = useState(topic?.totalQuestions?.toString() ?? '')
  const [startPage, setStartPage] = useState(topic?.startPage?.toString() ?? '')
  const [endPage, setEndPage] = useState(topic?.endPage?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const count = parseInt(totalQuestions, 10)
    if (!name.trim()) {
      setError('Topic name is required')
      return
    }
    if (isNaN(count) || count < 1) {
      setError('Total questions must be at least 1')
      return
    }

    const start = startPage.trim() ? parseInt(startPage, 10) : undefined
    const end = endPage.trim() ? parseInt(endPage, 10) : undefined

    if (start !== undefined && (isNaN(start) || start < 1)) {
      setError('Start page must be a positive number')
      return
    }
    if (end !== undefined && (isNaN(end) || end < 1)) {
      setError('End page must be a positive number')
      return
    }
    if (start !== undefined && end !== undefined && end < start) {
      setError('End page must be greater than or equal to start page')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        totalQuestions: count,
        startPage: start,
        endPage: end,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-muted">Topic Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-app bg-surface px-3 py-2 text-app focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="text-sm text-muted">Total Questions</label>
        <input
          type="number"
          min={1}
          value={totalQuestions}
          onChange={(e) => setTotalQuestions(e.target.value)}
          className="mt-1 w-full rounded-lg border border-app bg-surface px-3 py-2 text-app focus:border-accent focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted">Start Page</label>
          <input
            type="number"
            min={1}
            value={startPage}
            onChange={(e) => setStartPage(e.target.value)}
            placeholder="e.g. 42"
            className="mt-1 w-full rounded-lg border border-app bg-surface px-3 py-2 text-app focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted">End Page</label>
          <input
            type="number"
            min={1}
            value={endPage}
            onChange={(e) => setEndPage(e.target.value)}
            placeholder="e.g. 58"
            className="mt-1 w-full rounded-lg border border-app bg-surface px-3 py-2 text-app focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-app py-2.5 text-sm text-app"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export function formatPageRange(topic: Topic): string | null {
  if (topic.startPage && topic.endPage) {
    return `pp. ${topic.startPage}–${topic.endPage}`
  }
  if (topic.startPage) {
    return `from p. ${topic.startPage}`
  }
  if (topic.endPage) {
    return `to p. ${topic.endPage}`
  }
  return null
}
