import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatCard } from '../components/dashboard/StatCard'
import { ProgressBar } from '../components/dashboard/ProgressBar'
import { db, getDefaultBook } from '../database/db'
import { getDashboardStats, getTopicStats } from '../services/analyticsService'
import { resetAllProgress, resetEntireApp } from '../services/resetService'
import { formatDuration } from '../utils/difficulty'
import type { DashboardStats, Topic } from '../types'

interface TopicWithStats extends Topic {
  solved: number
  accuracy: number
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topics, setTopics] = useState<TopicWithStats[]>([])
  const [bookName, setBookName] = useState<string>('')
  const [resetting, setResetting] = useState(false)

  const load = async () => {
    const book = await getDefaultBook()
    setBookName(book.name)
    const dashboardStats = await getDashboardStats()
    setStats(dashboardStats)

    const allTopics = await db.topics.where('bookId').equals(book.id).sortBy('name')
    const withStats: TopicWithStats[] = []

    for (const topic of allTopics) {
      const ts = await getTopicStats(topic)
      withStats.push({
        ...topic,
        solved: ts.questionsSolved,
        accuracy: ts.accuracy,
      })
    }

    setTopics(withStats)
  }

  useEffect(() => {
    load()
  }, [])

  const handleResetAllProgress = async () => {
    const confirmed = confirm(
      'Reset ALL practice progress across every topic?\n\nSessions, answers, and mistakes will be deleted. Topics and answer keys will be kept.',
    )
    if (!confirmed) return

    setResetting(true)
    try {
      await resetAllProgress()
      await load()
    } finally {
      setResetting(false)
    }
  }

  const handleResetEntireApp = async () => {
    const confirmed = confirm(
      'Reset the ENTIRE app?\n\nThis deletes all topics, answer keys, sessions, and progress, then restores default topics. This cannot be undone.',
    )
    if (!confirmed) return

    const doubleCheck = confirm('Are you absolutely sure? All your data will be erased.')
    if (!doubleCheck) return

    setResetting(true)
    try {
      await resetEntireApp()
      await load()
    } finally {
      setResetting(false)
    }
  }

  if (!stats) {
    return <p className="text-center text-muted">Loading...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted">{bookName || 'Your SSC practice overview'}</p>
      </div>

      <div className="rounded-xl border border-app bg-surface/60 p-4 text-xs text-muted">
        <p className="font-medium text-muted">Your data stays on this phone</p>
        <p className="mt-1">
          Progress is saved locally in your browser. Closing the app or stopping the dev server
          does not delete it. Each phone has its own separate data — two people on two phones
          will not share progress automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Questions Solved" value={stats.totalQuestionsSolved} />
        <StatCard label="Accuracy" value={`${stats.overallAccuracy.toFixed(1)}%`} accent="text-success" />
        <StatCard label="Correct" value={stats.totalCorrect} accent="text-success" />
        <StatCard label="Wrong" value={stats.totalWrong} accent="text-danger" />
      </div>

      <StatCard
        label="Average Time"
        value={formatDuration(stats.averageTimeMs)}
        sub={`${stats.topicsCompleted}/${stats.totalTopics} topics completed`}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Topics</h2>
          <Link to="/topics" className="text-sm text-accent">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {topics.slice(0, 5).map((topic) => (
            <Link
              key={topic.id}
              to={`/topics/${topic.id}`}
              className="block rounded-xl border border-app bg-surface p-4 transition-colors hover:border-app"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{topic.name}</span>
                <span className="text-xs text-muted">
                  {topic.accuracy.toFixed(0)}% acc
                </span>
              </div>
              <ProgressBar value={topic.solved} max={topic.totalQuestions} />
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-app bg-surface p-4">
        <h2 className="text-sm font-semibold text-app">Reset data</h2>
        <p className="mt-1 text-xs text-muted">Confirmation is required before anything is deleted.</p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            disabled={resetting}
            onClick={handleResetAllProgress}
            className="w-full rounded-lg border border-warning py-2.5 text-sm text-warning disabled:opacity-50"
          >
            Reset all progress
          </button>
          <button
            type="button"
            disabled={resetting}
            onClick={handleResetEntireApp}
            className="w-full rounded-lg border border-danger py-2.5 text-sm text-danger disabled:opacity-50"
          >
            Reset entire app
          </button>
        </div>
      </div>
    </div>
  )
}
