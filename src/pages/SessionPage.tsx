import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnswerButtons } from '../components/session/AnswerButtons'
import { QuestionNumberDisplay } from '../components/session/QuestionNumberDisplay'
import { QuestionPicker } from '../components/session/QuestionPicker'
import { SessionTimer } from '../components/session/SessionResults'
import { formatPageRange } from '../components/topics/TopicForm'
import { db } from '../database/db'
import { useQuestionTimer } from '../hooks/useQuestionTimer'
import {
  computeElapsedMs,
  endSession,
  getSessionAnswers,
  navigateToQuestion,
  pauseSession,
  resumeSession,
  submitAnswer,
} from '../services/sessionService'
import type { Answer, AnswerChoice, Session, Topic } from '../types'

const SELECTION_DISPLAY_MS = 450

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [sessionAnswers, setSessionAnswers] = useState<Answer[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<AnswerChoice | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isPaused = session?.status === 'paused'

  const { elapsedMs, pauseTimer, syncElapsed } = useQuestionTimer({
    session,
    isPaused,
  })

  const load = useCallback(async () => {
    if (!sessionId) return
    const s = await db.sessions.get(sessionId)
    if (!s) {
      navigate('/topics')
      return
    }
    if (s.status === 'completed') {
      navigate(`/session/${sessionId}/results`)
      return
    }
    const t = await db.topics.get(s.topicId)
    setSession(s)
    setTopic(t ?? null)
    setSessionAnswers(await getSessionAnswers(sessionId))
  }, [sessionId, navigate])

  useEffect(() => {
    load()
  }, [load])

  const handleAnswer = async (selected: AnswerChoice) => {
    if (!session || submitting || isPaused) return
    setSubmitting(true)
    setError(null)
    setSelectedChoice(selected)

    await new Promise((resolve) => setTimeout(resolve, SELECTION_DISPLAY_MS))

    const timeTaken = syncElapsed()

    try {
      const result = await submitAnswer(session.id, selected, timeTaken)
      setSession(result.session)
      setSessionAnswers(await getSessionAnswers(session.id))
      setSelectedChoice(null)

      if (result.nextQuestion && result.nextQuestion > (topic?.totalQuestions ?? 0)) {
        await handleEnd()
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
      setSelectedChoice(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleJump = async (questionNumber: number) => {
    if (!session || !topic) return
    if (questionNumber < 1 || questionNumber > topic.totalQuestions) return
    if (questionNumber === session.currentQuestion) {
      setShowPicker(false)
      return
    }

    const updated = await navigateToQuestion(session.id, questionNumber, 'jump', 0)
    setSession(updated)
    setSelectedChoice(null)
    setShowPicker(false)
  }

  const handleNext = async () => {
    if (!session || !topic) return
    const next = session.currentQuestion + 1
    if (next > topic.totalQuestions) return

    const updated = await navigateToQuestion(session.id, next, 'sequential', 0)
    setSession(updated)
    setSelectedChoice(null)
  }

  const handlePause = async () => {
    if (!session) return
    const elapsed = syncElapsed()
    await pauseTimer()
    const updated = await pauseSession(session.id, elapsed)
    setSession(updated)
  }

  const handleResume = async () => {
    if (!session) return
    const updated = await resumeSession(session.id)
    setSession(updated)
  }

  const handleEnd = async () => {
    if (!session) return
    const elapsed = computeElapsedMs(session)
    await pauseTimer()
    const updated = await endSession(session.id, elapsed)
    setSession(updated)
    navigate(`/session/${session.id}/results`)
  }

  if (!session || !topic) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app">
        <p className="text-muted">Loading session...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-app">
      <div className="flex items-center justify-end border-b border-app px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="rounded-lg bg-surface-elevated px-3 py-1.5 text-xs text-app"
          >
            Jump
          </button>
          {isPaused ? (
            <button
              type="button"
              onClick={handleResume}
              className="rounded-lg bg-success px-3 py-1.5 text-xs text-white"
            >
              Resume
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="rounded-lg bg-surface-elevated px-3 py-1.5 text-xs text-app"
            >
              Pause
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 p-4">
        {isPaused && (
          <div className="rounded-lg bg-warning-soft px-4 py-3 text-center text-sm text-warning">
            Session paused — tap Resume to continue
          </div>
        )}

        <QuestionNumberDisplay
          questionNumber={session.currentQuestion}
          totalQuestions={topic.totalQuestions}
          topicName={topic.name}
          pageRange={formatPageRange(topic)}
          firstQuestionNumber={topic.firstQuestionNumber}
        />

        <SessionTimer elapsedMs={elapsedMs} />

        <p className="text-center text-sm text-muted">
          Solve in your book, then tap your answer
        </p>

        {error && <p className="text-center text-sm text-danger">{error}</p>}

        <AnswerButtons
          onSelect={handleAnswer}
          disabled={submitting || isPaused}
          selectedChoice={selectedChoice}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleNext}
            disabled={isPaused || session.currentQuestion >= topic.totalQuestions}
            className="flex-1 rounded-lg border border-app py-2.5 text-sm text-app disabled:opacity-50"
          >
            Next →
          </button>
          <button
            type="button"
            onClick={handleEnd}
            className="flex-1 rounded-lg border border-danger py-2.5 text-sm text-danger"
          >
            End Session
          </button>
        </div>
      </div>

      {showPicker && (
        <QuestionPicker
          totalQuestions={topic.totalQuestions}
          currentQuestion={session.currentQuestion}
          sessionAnswers={sessionAnswers}
          onSelect={handleJump}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
