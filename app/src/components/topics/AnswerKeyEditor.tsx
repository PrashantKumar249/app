import { useState } from 'react'
import {
  parseAnswerKey,
  validateParsedAnswerKey,
} from '../../utils/answerKeyParser'

interface AnswerKeyEditorProps {
  totalQuestions: number
  initialValue?: string
  onSave: (answerKey: string[], firstQuestionNumber?: number) => Promise<void>
}

export function AnswerKeyEditor({ totalQuestions, initialValue, onSave }: AnswerKeyEditorProps) {
  const [text, setText] = useState(initialValue ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setError(null)
    setSuccess(false)

    const parsed = parseAnswerKey(text)
    if (!parsed.success) {
      setError(parsed.error)
      return
    }

    const validated = validateParsedAnswerKey(parsed, totalQuestions)
    if (!validated.success) {
      setError(validated.error)
      return
    }

    setSaving(true)
    try {
      await onSave(
        validated.answers,
        validated.firstQuestionNumber > 1 ? validated.firstQuestionNumber : undefined,
      )
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-app">Answer Key</label>
        <p className="text-xs text-muted">
          Paste continuous (ACBD...), line format (1-A), or Pinnacle grid (133.(b) 134.(a)...).
          Expected: {totalQuestions} answers.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={'133.(b) 134.(a) 135.(d)...\n\nor ACBDABCD...\n\nor 1-A\n2-C'}
        className="w-full rounded-lg border border-app bg-surface p-3 font-mono text-sm text-app placeholder:text-faint focus:border-accent focus:outline-none"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">Answer key saved!</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !text.trim()}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Answer Key'}
      </button>
    </div>
  )
}
