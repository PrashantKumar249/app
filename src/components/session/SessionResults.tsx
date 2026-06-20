import { formatDuration, formatTimer } from '../../utils/difficulty'
import type { SessionAnswerReview, SessionSummary } from '../../types'
import { StatCard } from '../dashboard/StatCard'

interface SessionResultsProps {
  summary: SessionSummary
  topicName: string
  answers: SessionAnswerReview[]
  onDone: () => void
}

export function SessionResults({ summary, topicName, answers, onDone }: SessionResultsProps) {
  const wrongAnswers = answers.filter((a) => !a.isCorrect)
  const correctAnswers = answers.filter((a) => a.isCorrect)

  return (
    <div className="space-y-4 p-4">
      <div className="text-center">
        <h1 className="text-xl font-bold">Session Complete</h1>
        <p className="text-sm text-muted">{topicName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Attempted" value={summary.attempted} />
        <StatCard label="Correct" value={summary.correct} accent="text-success" />
        <StatCard label="Wrong" value={summary.wrong} accent="text-danger" />
        <StatCard label="Unattempted" value={summary.unattempted} accent="text-muted" />
      </div>

      <StatCard
        label="Accuracy"
        value={`${summary.accuracy.toFixed(1)}%`}
        sub={`Time: ${formatDuration(summary.totalTimeSpent)}`}
      />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-app">Answer Review</h2>
        <p className="mb-3 text-xs text-muted">
          All answers from this session — {correctAnswers.length} correct, {wrongAnswers.length}{' '}
          wrong
        </p>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {answers
            .slice()
            .sort((a, b) => a.questionNumber - b.questionNumber)
            .map((answer) => (
              <div
                key={answer.questionNumber}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${
                  answer.isCorrect
                    ? 'border-success/50 bg-success-soft/30'
                    : 'border-danger/50 bg-danger-soft/30'
                }`}
              >
                <span className="font-medium text-app">Q{answer.questionNumber}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted">
                    You: <span className="font-bold text-app">{answer.selectedAnswer}</span>
                  </span>
                  <span className="text-faint">→</span>
                  <span className="text-muted">
                    Key: <span className="font-bold text-app">{answer.correctAnswer}</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-medium ${
                      answer.isCorrect ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                    }`}
                  >
                    {answer.isCorrect ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-lg bg-accent py-3 font-semibold text-white"
      >
        Back to Topic
      </button>
    </div>
  )
}

export function SessionTimer({ elapsedMs }: { elapsedMs: number }) {
  return (
    <div className="rounded-lg bg-surface px-4 py-2 text-center">
      <p className="text-xs text-muted">Time on question</p>
      <p className="font-mono text-2xl font-bold text-accent">{formatTimer(elapsedMs)}</p>
    </div>
  )
}
