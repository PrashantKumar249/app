import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnswerKeyEditor } from '../components/topics/AnswerKeyEditor'
import { answerKeyToText } from '../utils/answerKeyText'
import { TopicForm, formatPageRange } from '../components/topics/TopicForm'
import { ProgressBar } from '../components/dashboard/ProgressBar'
import { TopicStatsPanel } from '../components/analytics/Charts'
import { db } from '../database/db'
import { getTopicStats } from '../services/analyticsService'
import {
  getActiveOrPausedSession,
  getSessionsForTopic,
  startSession,
} from '../services/sessionService'
import { resetTopicProgress } from '../services/resetService'
import type { Session, Topic, TopicFormData, TopicStats } from '../types'

export function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [stats, setStats] = useState<TopicStats | null>(null)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [pastSessions, setPastSessions] = useState<Session[]>([])
  const [editing, setEditing] = useState(false)
  const [showKeyEditor, setShowKeyEditor] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    const t = await db.topics.get(id)
    if (!t) return
    setTopic(t)
    setStats(await getTopicStats(t))
    setActiveSession((await getActiveOrPausedSession(id)) ?? null)
    setPastSessions(await getSessionsForTopic(id))
  }

  useEffect(() => {
    load()
  }, [id])

  if (!topic) {
    return <p className="text-center text-muted">Topic not found</p>
  }

  const hasAnswerKey = topic.answerKey.length === topic.totalQuestions
  const pageRange = formatPageRange(topic)

  const handleUpdate = async (data: TopicFormData) => {
    await db.topics.update(topic.id, {
      name: data.name,
      totalQuestions: data.totalQuestions,
      startPage: data.startPage,
      endPage: data.endPage,
      ...(data.totalQuestions !== topic.totalQuestions ? { answerKey: [] } : {}),
    })
    setEditing(false)
    await load()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${topic.name}" and all its data?`)) return
    await db.transaction('rw', [db.topics, db.sessions, db.answers, db.mistakes], async () => {
      await db.answers.where('topicId').equals(topic.id).delete()
      await db.sessions.where('topicId').equals(topic.id).delete()
      await db.mistakes.where('topicId').equals(topic.id).delete()
      await db.topics.delete(topic.id)
    })
    navigate('/topics')
  }

  const handleSaveAnswerKey = async (answerKey: string[], firstQuestionNumber?: number) => {
    await db.topics.update(topic.id, {
      answerKey,
      firstQuestionNumber: firstQuestionNumber ?? 1,
    })
    setShowKeyEditor(false)
    await load()
  }

  const handleResetTopicProgress = async () => {
    if (
      !confirm(
        `Reset all progress for "${topic.name}"?\n\nThis deletes sessions, answers, and mistakes for this topic. The answer key and topic settings will be kept.`,
      )
    ) {
      return
    }
    await resetTopicProgress(topic.id)
    await load()
  }

  const handleStartSession = async () => {
    setError(null)
    if (!hasAnswerKey) {
      setError('Add an answer key before starting a session')
      return
    }
    try {
      const session = await startSession(topic.id)
      navigate(`/session/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
    }
  }

  const handleResume = () => {
    if (activeSession) navigate(`/session/${activeSession.id}`)
  }

  return (
    <div className="space-y-4">
      <Link to="/topics" className="text-sm text-accent">
        ← Back to Topics
      </Link>

      {editing ? (
        <div className="rounded-xl border border-app bg-surface p-4">
          <TopicForm topic={topic} onSave={handleUpdate} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{topic.name}</h1>
              <p className="text-sm text-muted">
                {topic.totalQuestions} questions
                {pageRange && ` · ${pageRange}`}
              </p>
            </div>
            <button type="button" onClick={() => setEditing(true)} className="text-sm text-accent">
              Edit
            </button>
          </div>
          {stats && (
            <div className="mt-3">
              <ProgressBar
                value={stats.questionsSolved}
                max={topic.totalQuestions}
                label="Progress"
              />
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-app bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Answer Key</h2>
          {!showKeyEditor && (
            <button
              type="button"
              onClick={() => setShowKeyEditor(true)}
              className="text-sm text-accent"
            >
              {hasAnswerKey ? 'Edit' : 'Paste'}
            </button>
          )}
        </div>
        {hasAnswerKey && !showKeyEditor && (
          <p className="mt-2 text-sm text-success">
            ✓ {topic.answerKey.length} answers configured
          </p>
        )}
        {showKeyEditor && (
          <div className="mt-3">
            <AnswerKeyEditor
              totalQuestions={topic.totalQuestions}
              initialValue={answerKeyToText(topic.answerKey)}
              onSave={handleSaveAnswerKey}
            />
            <button
              type="button"
              onClick={() => setShowKeyEditor(false)}
              className="mt-2 text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {stats && <TopicStatsPanel stats={stats} topicName={topic.name} />}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="space-y-2">
        {activeSession ? (
          <button
            type="button"
            onClick={handleResume}
            className="w-full rounded-lg bg-success py-3 font-semibold text-white"
          >
            {activeSession.status === 'paused' ? 'Resume Session' : 'Continue Session'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartSession}
            disabled={!hasAnswerKey}
            className="w-full rounded-lg bg-accent py-3 font-semibold text-white disabled:opacity-50"
          >
            Start New Session
          </button>
        )}
      </div>

      {pastSessions.filter((s) => s.status === 'completed').length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted">Past Sessions</h3>
          <div className="space-y-2">
            {pastSessions
              .filter((s) => s.status === 'completed')
              .slice(0, 5)
              .map((s) => (
                <Link
                  key={s.id}
                  to={`/session/${s.id}/results`}
                  className="block rounded-lg border border-app bg-surface px-4 py-3 text-sm"
                >
                  {new Date(s.startedAt).toLocaleString()}
                  {s.endedAt && (
                    <span className="ml-2 text-muted">
                      · {Math.round(s.totalTimeSpent / 60000)}m
                    </span>
                  )}
                </Link>
              ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleResetTopicProgress}
        className="w-full rounded-lg border border-warning py-2.5 text-sm text-warning"
      >
        Reset Topic Progress
      </button>

      <button type="button" onClick={handleDelete} className="w-full py-2 text-sm text-danger">
        Delete Topic
      </button>
    </div>
  )
}
