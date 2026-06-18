import { useMemo, useState } from 'react'
import { AdvancedFilters, type FilterChip } from '../filters/AdvancedFilters'
import type { Answer } from '../../types'

interface QuestionPickerProps {
  totalQuestions: number
  currentQuestion: number
  sessionAnswers: Answer[]
  onSelect: (questionNumber: number) => void
  onClose: () => void
}

const PICKER_CHIPS: FilterChip[] = [
  { id: 'status:attempted', label: 'Attempted', group: 'Status' },
  { id: 'status:unattempted', label: 'Unattempted', group: 'Status' },
]

export function QuestionPicker({
  totalQuestions,
  currentQuestion,
  sessionAnswers,
  onSelect,
  onClose,
}: QuestionPickerProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [rangeFrom, setRangeFrom] = useState('1')
  const [rangeTo, setRangeTo] = useState(String(totalQuestions))

  const attemptedInSession = useMemo(() => {
    const set = new Set<number>()
    for (const a of sessionAnswers) set.add(a.questionNumber)
    return set
  }, [sessionAnswers])

  const questions = useMemo(() => {
    const showAttempted = activeFilters.includes('status:attempted')
    const showUnattempted = activeFilters.includes('status:unattempted')
    const from = Math.max(1, parseInt(rangeFrom, 10) || 1)
    const to = Math.min(totalQuestions, parseInt(rangeTo, 10) || totalQuestions)

    return Array.from({ length: totalQuestions }, (_, i) => i + 1).filter((q) => {
      if (q < from || q > to) return false
      if (!showAttempted && !showUnattempted) return true
      const attempted = attemptedInSession.has(q)
      if (showAttempted && showUnattempted) return true
      if (showAttempted) return attempted
      return !attempted
    })
  }, [totalQuestions, activeFilters, rangeFrom, rangeTo, attemptedInSession])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app">
      <div className="flex items-center justify-between border-b border-app px-4 py-3">
        <h2 className="font-semibold">Jump to Question</h2>
        <button type="button" onClick={onClose} className="text-muted">
          Close
        </button>
      </div>

      <div className="space-y-3 border-b border-app p-4">
        <AdvancedFilters
          chips={PICKER_CHIPS}
          activeIds={activeFilters}
          onChange={setActiveFilters}
          title="Filter questions"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted">From</label>
            <input
              type="number"
              min={1}
              max={totalQuestions}
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-app px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted">To</label>
            <input
              type="number"
              min={1}
              max={totalQuestions}
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-app px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-muted">{questions.length} questions shown</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q) => {
            const attempted = attemptedInSession.has(q)
            const isCurrent = q === currentQuestion
            return (
              <button
                key={q}
                type="button"
                onClick={() => {
                  onSelect(q)
                  onClose()
                }}
                className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-accent text-white ring-2 ring-accent'
                    : attempted
                      ? 'bg-surface-elevated text-success'
                      : 'bg-surface text-muted'
                }`}
              >
                {q}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
