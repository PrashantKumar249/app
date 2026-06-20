import type { Session } from '../../types'

interface TopicPracticeCardProps {
  activeSession: Session | null
  nextQuestion: number
  questionsSolved: number
  totalQuestions: number
  completedSessionCount: number
  hasAnswerKey: boolean
  onContinue: () => void
  onNewSession: () => void
}

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TopicPracticeCard({
  activeSession,
  nextQuestion,
  questionsSolved,
  totalQuestions,
  completedSessionCount,
  hasAnswerKey,
  onContinue,
  onNewSession,
}: TopicPracticeCardProps) {
  const topicComplete = questionsSolved >= totalQuestions && totalQuestions > 0

  return (
    <div className="rounded-xl border border-app bg-surface p-4">
      <h2 className="font-semibold">Practice</h2>

      {activeSession ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted">
            You have one unfinished session for this topic. Continue at the question below, or
            end that session from the practice screen before starting a new one.
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-lg bg-success py-3 font-semibold text-white"
          >
            Continue at Q{activeSession.currentQuestion}
          </button>
          <p className="text-xs text-muted">
            {activeSession.status === 'paused' ? 'Paused' : 'In progress'} · started{' '}
            {formatSessionDate(activeSession.startedAt)}
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted">
            {questionsSolved === 0
              ? 'Start your first practice session for this topic.'
              : topicComplete
                ? 'You have attempted every question. A new session starts from Q1 for review.'
                : `Opens a new session at Q${nextQuestion}. Questions you already attempted are skipped — progress is saved across all sessions.`}
          </p>
          <button
            type="button"
            onClick={onNewSession}
            disabled={!hasAnswerKey}
            className="w-full rounded-lg bg-accent py-3 font-semibold text-white disabled:opacity-50"
          >
            New session · Q{nextQuestion}
          </button>
          {completedSessionCount > 0 && (
            <p className="text-xs text-muted">
              {completedSessionCount} completed session{completedSessionCount === 1 ? '' : 's'} ·{' '}
              {questionsSolved}/{totalQuestions} questions done
            </p>
          )}
        </div>
      )}
    </div>
  )
}
