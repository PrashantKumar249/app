export interface FilterChip {
  id: string
  label: string
  group: string
}

interface AdvancedFiltersProps {
  chips: FilterChip[]
  activeIds: string[]
  onChange: (activeIds: string[]) => void
  title?: string
}

export function AdvancedFilters({
  chips,
  activeIds,
  onChange,
  title = 'Filters',
}: AdvancedFiltersProps) {
  const groups = [...new Set(chips.map((c) => c.group))]

  const toggle = (id: string, group: string) => {
    const groupChips = chips.filter((c) => c.group === group)
    const singleSelectGroups = new Set(['Answer key', 'Progress', 'Occurrences', 'Sort'])
    const isMulti = !singleSelectGroups.has(group)

    if (activeIds.includes(id)) {
      onChange(activeIds.filter((x) => x !== id))
      return
    }

    if (isMulti) {
      onChange([...activeIds, id])
      return
    }

    const withoutGroup = activeIds.filter(
      (x) => !groupChips.some((c) => c.id === x),
    )
    onChange([...withoutGroup, id])
  }

  const clearAll = () => onChange([])

  return (
    <div className="rounded-xl border border-app bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-app">{title}</h3>
        {activeIds.length > 0 && (
          <button type="button" onClick={clearAll} className="text-xs text-accent">
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group}>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              {group}
            </p>
            <div className="flex flex-wrap gap-2">
              {chips
                .filter((c) => c.group === group)
                .map((chip) => {
                  const active = activeIds.includes(chip.id)
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggle(chip.id, group)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-accent text-white'
                          : 'border border-app bg-surface-elevated text-muted'
                      }`}
                    >
                      {chip.label}
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      {activeIds.length > 0 && (
        <p className="mt-3 text-xs text-muted">{activeIds.length} filter(s) active</p>
      )}
    </div>
  )
}
