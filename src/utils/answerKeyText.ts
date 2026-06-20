export function answerKeyToText(answerKey: string[]): string {
  if (answerKey.length === 0) return ''
  return answerKey.join('')
}
