import { useEffect, useMemo, useState } from 'react'
import { AdvancedFilters, type FilterChip } from '../components/filters/AdvancedFilters'
import { StatCard } from '../components/dashboard/StatCard'
import { db } from '../database/db'
import { getMistakesByTopic } from '../services/mistakeService'
import type { Mistake, Topic } from '../types'

const MISTAKE_FILTER_CHIPS: FilterChip[] = [
  { id: 'occurrence:1', label: '1+ times', group: 'Occurrences' },
  { id: 'occurrence:2', label: '2+ times', group: 'Occurrences' },
  { id: 'occurrence:3', label: '3+ times', group: 'Occurrences' },
  { id: 'sort:lastSeen', label: 'Recent first', group: 'Sort' },
  { id: 'sort:occurrences', label: 'Most repeated', group: 'Sort' },
  { id: 'sort:question', label: 'Question #', group: 'Sort' },
]

function getSingleFilter(activeIds: string[], group: string, fallback: string): string {
  const match = activeIds.find((id) => id.startsWith(`${group}:`))
  return match?.split(':')[1] ?? fallback
}

export function MistakesPage() {
  const [allMistakes, setAllMistakes] = useState<Mistake[]>([])
  const [topics, setTopics] = useState<Map<string, Topic>>(new Map())
  const [activeFilters, setActiveFilters] = useState<string[]>(['sort:lastSeen'])
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const allTopics = await db.topics.toArray()
      setTopics(new Map(allTopics.map((t) => [t.id, t])))
      setAllMistakes(await getMistakesByTopic())
    }
    load()
  }, [])

  const topicChips: FilterChip[] = useMemo(
    () =>
      Array.from(topics.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({
          id: `topic:${t.id}`,
          label: t.name,
          group: 'Topics',
        })),
    [topics],
  )

  const filterChips = useMemo(
    () => [...MISTAKE_FILTER_CHIPS, ...topicChips],
    [topicChips],
  )

  const handleFilterChange = (ids: string[]) => {
    setActiveFilters(ids)
    setSelectedTopicIds(ids.filter((id) => id.startsWith('topic:')).map((id) => id.split(':')[1]))
  }

  const mistakes = useMemo(() => {
    const minOccurrence = Number(getSingleFilter(activeFilters, 'occurrence', '1'))
    const sortBy = getSingleFilter(activeFilters, 'sort', 'lastSeen')

    let rows = allMistakes.filter((m) => m.occurrenceCount >= minOccurrence)

    if (selectedTopicIds.length > 0) {
      rows = rows.filter((m) => selectedTopicIds.includes(m.topicId))
    }

    rows = [...rows].sort((a, b) => {
      if (sortBy === 'occurrences') return b.occurrenceCount - a.occurrenceCount
      if (sortBy === 'question') return a.questionNumber - b.questionNumber
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    })

    return rows
  }, [allMistakes, activeFilters, selectedTopicIds])

  const totalOccurrences = mistakes.reduce((sum, m) => sum + m.occurrenceCount, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Mistake Bank</h1>
        <p className="text-sm text-muted">Review questions you got wrong</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Unique Mistakes" value={mistakes.length} accent="text-danger" />
        <StatCard label="Total Occurrences" value={totalOccurrences} accent="text-warning" />
      </div>

      <AdvancedFilters
        chips={filterChips}
        activeIds={activeFilters}
        onChange={handleFilterChange}
        title="Filter mistakes"
      />

      {mistakes.length === 0 ? (
        <div className="rounded-xl border border-app bg-surface p-8 text-center">
          <p className="text-4xl">🎉</p>
          <p className="mt-2 font-medium text-app">No mistakes match filters</p>
          <p className="text-sm text-muted">Try clearing filters or keep practicing</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mistakes.map((m) => {
            const topic = topics.get(m.topicId)
            return (
              <div key={m.id} className="rounded-xl border border-app bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-app">
                      Q{m.questionNumber}
                      {topic && (
                        <span className="ml-2 text-sm font-normal text-muted">{topic.name}</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Your answer: <span className="text-danger">{m.selectedAnswer}</span>
                      {' · '}
                      Correct: <span className="text-success">{m.correctAnswer}</span>
                    </p>
                  </div>
                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs text-danger">
                    ×{m.occurrenceCount}
                  </span>
                </div>
                <p className="mt-2 text-xs text-faint">
                  Last seen: {new Date(m.lastSeen).toLocaleDateString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
