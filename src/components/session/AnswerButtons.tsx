import type { AnswerChoice } from '../../types'

interface AnswerButtonsProps {
  onSelect: (answer: AnswerChoice) => void
  disabled?: boolean
  selectedChoice?: AnswerChoice | null
}

const CHOICES: AnswerChoice[] = ['A', 'B', 'C', 'D']

export function AnswerButtons({ onSelect, disabled, selectedChoice }: AnswerButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CHOICES.map((choice) => {
        const isSelected = selectedChoice === choice
        return (
          <button
            key={choice}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(choice)}
            className={`rounded-xl border py-6 text-2xl font-bold transition-all duration-200 disabled:opacity-50 ${
              isSelected
                ? 'scale-105 border-accent bg-accent text-white shadow-lg shadow-accent/30 ring-2 ring-accent'
                : 'border-app bg-surface text-app active:bg-surface-elevated'
            }`}
          >
            {choice}
          </button>
        )
      })}
    </div>
  )
}
