import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Difficulty, TopicStats } from '../../types'
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, formatDuration } from '../../utils/difficulty'

interface DifficultyChartProps {
  distribution: Record<Difficulty, number>
}

export function DifficultyChart({ distribution }: DifficultyChartProps) {
  const data = (Object.keys(distribution) as Difficulty[])
    .map((key) => ({
      name: DIFFICULTY_LABELS[key],
      value: distribution[key],
      color: DIFFICULTY_COLORS[key],
    }))
    .filter((d) => d.value > 0)

  if (data.length === 0) {
    return <p className="text-sm text-muted">No data yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface TopicStatsPanelProps {
  stats: TopicStats
  topicName: string
}

export function TopicStatsPanel({ stats, topicName }: TopicStatsPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-app">{topicName}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-surface p-3">
          <p className="text-muted">Solved</p>
          <p className="text-lg font-bold text-accent">{stats.questionsSolved}</p>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <p className="text-muted">Remaining</p>
          <p className="text-lg font-bold">{stats.questionsRemaining}</p>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <p className="text-muted">Accuracy</p>
          <p className="text-lg font-bold text-success">{stats.accuracy.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <p className="text-muted">Avg Time</p>
          <p className="text-lg font-bold">{formatDuration(stats.averageTimeMs)}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm text-muted">Difficulty Distribution</p>
        <DifficultyChart distribution={stats.difficultyDistribution} />
      </div>
    </div>
  )
}

interface TrendChartProps {
  data: { date: string; attempted: number; correct: number; accuracy: number }[]
  title: string
}

export function TrendChart({ data, title }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div>
        <p className="mb-2 text-sm font-medium text-app">{title}</p>
        <p className="text-sm text-muted">No activity yet</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-app">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          />
          <Line type="monotone" dataKey="attempted" stroke="#3b82f6" name="Attempted" />
          <Line type="monotone" dataKey="correct" stroke="#22c55e" name="Correct" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface AccuracyBarChartProps {
  data: { name: string; accuracy: number }[]
}

export function AccuracyBarChart({ data }: AccuracyBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">No topic data yet</p>
  }

  const top = data.slice(0, 8)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={top} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" width={75} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
        />
        <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
