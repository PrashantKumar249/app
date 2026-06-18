import type { AnswerChoice } from '../types'

export interface ParseResult {
  success: true
  answers: AnswerChoice[]
  firstQuestionNumber: number
  detectedRange?: { from: number; to: number }
  parseMode: 'continuous' | 'line-numbered' | 'pinnacle-grid'
}

export interface ParseError {
  success: false
  error: string
  partialCount?: number
  missingNumbers?: number[]
}

export type AnswerKeyParseResult = ParseResult | ParseError

const VALID_ANSWERS = new Set(['A', 'B', 'C', 'D'])

function normalizeChar(char: string): AnswerChoice | null {
  const upper = char.toUpperCase()
  return VALID_ANSWERS.has(upper) ? (upper as AnswerChoice) : null
}

function parseLineNumberedFormat(text: string): ParseResult | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return null

  const numberedPattern = /^\d+\s*[-.:)]\s*([A-Da-d])\s*$/i
  const numberedMatches = lines.filter((line) => numberedPattern.test(line))

  if (numberedMatches.length < lines.length * 0.5) {
    return null
  }

  const answers: AnswerChoice[] = []
  for (const line of lines) {
    const match = line.match(numberedPattern)
    if (!match) return null
    const answer = normalizeChar(match[1])
    if (!answer) return null
    answers.push(answer)
  }

  return {
    success: true,
    answers,
    firstQuestionNumber: 1,
    parseMode: 'line-numbered',
  }
}

/** Pinnacle paste format: 133.(b) 134.(a) ... */
function parsePinnacleGridFormat(text: string): ParseResult | ParseError | null {
  const entries = new Map<number, AnswerChoice>()
  const patterns = [
    /(\d{2,4})\s*\.\s*\(\s*([a-dA-D])\s*\)/gi,
    /(\d{2,4})\s*\(\s*([a-dA-D])\s*\)/gi,
    /(\d{2,4})\s*\.\s*([a-dA-D])\b/gi,
    /(\d{2,4})\s*[-:]\s*\(?\s*([a-dA-D])\s*\)?/gi,
  ]

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const num = parseInt(match[1], 10)
      const answer = normalizeChar(match[2])
      if (num > 0 && answer) entries.set(num, answer)
    }
  }

  if (entries.size < 3) return null

  const numbers = [...entries.keys()].sort((a, b) => a - b)
  const min = numbers[0]
  const max = numbers[numbers.length - 1]

  if (numbers.length !== max - min + 1) {
    const missingNumbers: number[] = []
    for (let n = min; n <= max; n++) {
      if (!entries.has(n)) missingNumbers.push(n)
    }
    const preview = missingNumbers.slice(0, 8).join(', ')
    const suffix = missingNumbers.length > 8 ? '...' : ''
    return {
      success: false,
      error: `Missing ${missingNumbers.length} question(s) (e.g. ${preview}${suffix}). Edit pasted text.`,
      partialCount: numbers.length,
      missingNumbers,
    }
  }

  return {
    success: true,
    answers: numbers.map((n) => entries.get(n)!),
    firstQuestionNumber: min,
    detectedRange: { from: min, to: max },
    parseMode: 'pinnacle-grid',
  }
}

function parseContinuousFormat(text: string): ParseResult {
  const compact = text.replace(/[\s,\r\n]+/g, '').toUpperCase()
  const answers: AnswerChoice[] = []

  for (const char of compact) {
    const answer = normalizeChar(char)
    if (!answer) throw new Error(`Invalid character "${char}" in answer key`)
    answers.push(answer)
  }

  return {
    success: true,
    answers,
    firstQuestionNumber: 1,
    parseMode: 'continuous',
  }
}

export function parseAnswerKey(text: string): AnswerKeyParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { success: false, error: 'Answer key cannot be empty' }

  try {
    const pinnacle = parsePinnacleGridFormat(trimmed)
    if (pinnacle) return pinnacle

    const lineNumbered = parseLineNumberedFormat(trimmed)
    if (lineNumbered) return lineNumbered

    return parseContinuousFormat(trimmed)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse answer key',
    }
  }
}

export function validateParsedAnswerKey(
  parsed: ParseResult,
  totalQuestions: number,
): AnswerKeyParseResult {
  if (parsed.answers.length !== totalQuestions) {
    const rangeHint = parsed.detectedRange
      ? ` (found Q${parsed.detectedRange.from}–Q${parsed.detectedRange.to})`
      : ''
    return {
      success: false,
      error: `Expected ${totalQuestions} answers but found ${parsed.answers.length}${rangeHint}.`,
      partialCount: parsed.answers.length,
    }
  }
  return parsed
}
