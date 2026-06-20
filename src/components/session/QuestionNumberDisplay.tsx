interface QuestionNumberDisplayProps {
  questionNumber: number
  totalQuestions: number
  topicName: string
  pageRange?: string | null
  firstQuestionNumber?: number
}

export function QuestionNumberDisplay({
  questionNumber,
  totalQuestions,
  topicName,
  pageRange,
  firstQuestionNumber = 1,
}: QuestionNumberDisplayProps) {
  const bookQuestion =
    firstQuestionNumber > 1 ? firstQuestionNumber + questionNumber - 1 : null

  return (
    <div className="text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{topicName}</p>
      {pageRange && <p className="mt-0.5 text-xs text-faint">{pageRange}</p>}
      <div
        key={questionNumber}
        className="animate-question-in mt-3 inline-flex flex-col items-center gap-1 rounded-2xl border border-accent/40 bg-accent-soft px-6 py-3 shadow-lg shadow-accent/10"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-accent">Question</span>
          <span className="text-5xl font-black tabular-nums text-accent">{questionNumber}</span>
          <span className="text-lg text-muted">/ {totalQuestions}</span>
        </div>
        {bookQuestion && (
          <p className="text-sm font-medium text-warning/90">
            Book Q{bookQuestion}
          </p>
        )}
      </div>
    </div>
  )
}
