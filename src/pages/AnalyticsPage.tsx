import { useEffect, useState } from 'react'
import { AccuracyBarChart, TrendChart } from '../components/analytics/Charts'
import { StatCard } from '../components/dashboard/StatCard'
import { db } from '../database/db'
import {
  getDailyStats,
  getDashboardStats,
  getTopicStats,
  getWeeklyStats,
} from '../services/analyticsService'
import { formatDuration } from '../utils/difficulty'
import type { DashboardStats } from '../types'

export function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [daily, setDaily] = useState<Awaited<ReturnType<typeof getDailyStats>>>([])
  const [weekly, setWeekly] = useState<Awaited<ReturnType<typeof getWeeklyStats>>>([])
  const [topicAccuracy, setTopicAccuracy] = useState<{ name: string; accuracy: number }[]>([])

  useEffect(() => {
    async function load() {
      setStats(await getDashboardStats())
      setDaily(await getDailyStats(30))
      setWeekly(await getWeeklyStats(12))

      const topics = await db.topics.toArray()
      const accuracyData: { name: string; accuracy: number }[] = []
      for (const topic of topics) {
        const ts = await getTopicStats(topic)
        if (ts.questionsSolved > 0) {
          accuracyData.push({ name: topic.name, accuracy: Math.round(ts.accuracy) })
        }
      }
      accuracyData.sort((a, b) => a.accuracy - b.accuracy)
      setTopicAccuracy(accuracyData)
    }
    load()
  }, [])

  if (!stats) {
    return <p className="text-center text-muted">Loading...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-sm text-muted">Performance trends & weak areas</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Solved" value={stats.totalQuestionsSolved} />
        <StatCard label="Accuracy" value={`${stats.overallAccuracy.toFixed(1)}%`} accent="text-success" />
        <StatCard label="Avg Time" value={formatDuration(stats.averageTimeMs)} />
        <StatCard
          label="Topics Done"
          value={`${stats.topicsCompleted}/${stats.totalTopics}`}
          accent="text-accent"
        />
      </div>

      <TrendChart data={daily} title="Daily Activity (30 days)" />
      <TrendChart data={weekly} title="Weekly Activity" />

      <div>
        <p className="mb-2 text-sm font-medium text-app">Topic Accuracy (weakest first)</p>
        <AccuracyBarChart data={topicAccuracy} />
      </div>
    </div>
  )
}
