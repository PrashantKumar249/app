import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SessionResults } from '../components/session/SessionResults'
import { db } from '../database/db'
import { getSessionAnswerReview, getSessionSummary } from '../services/analyticsService'
import type { SessionAnswerReview, SessionSummary, Topic } from '../types'

export function SessionResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [answers, setAnswers] = useState<SessionAnswerReview[]>([])
  const [topic, setTopic] = useState<Topic | null>(null)

  useEffect(() => {
    async function load() {
      if (!sessionId) return
      const session = await db.sessions.get(sessionId)
      if (!session) {
        navigate('/topics')
        return
      }
      const t = await db.topics.get(session.topicId)
      setTopic(t ?? null)
      setSummary(await getSessionSummary(sessionId))
      setAnswers(await getSessionAnswerReview(sessionId))
    }
    load()
  }, [sessionId, navigate])

  if (!summary || !topic) {
    return <p className="text-center text-muted">Loading results...</p>
  }

  return (
    <SessionResults
      summary={summary}
      topicName={topic.name}
      answers={answers}
      onDone={() => navigate(`/topics/${topic.id}`)}
    />
  )
}
