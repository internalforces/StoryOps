import type { BenchmarkCase, ContinuityIssue, Lore, ReviewState } from '../types'

export interface SearchResult {
  lore: Lore
  score: number
}

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

export function tokenize(value: string): Set<string> {
  const normalized = normalize(value)
  const words = normalized.split(/\s+/).filter(Boolean)
  const grams: string[] = []
  for (const word of words) {
    if (word.length <= 2) grams.push(word)
    for (let index = 0; index < word.length - 1; index += 1) grams.push(word.slice(index, index + 2))
  }
  return new Set([...words, ...grams])
}

export function searchLore(query: string, lore: Lore[], limit = 5): SearchResult[] {
  const queryTokens = tokenize(query)
  return lore
    .map((item) => {
      const text = `${item.subject} ${item.attribute} ${item.value} ${item.statement} ${item.conflictingTerms.join(' ')}`
      const tokens = tokenize(text)
      const overlap = [...queryTokens].filter((token) => tokens.has(token)).length
      const subjectBoost = normalize(query).includes(normalize(item.subject)) ? 4 : 0
      const termBoost = item.conflictingTerms.some((term) => normalize(query).includes(normalize(term))) ? 3 : 0
      return { lore: item, score: Number(((overlap + subjectBoost + termBoost) / Math.max(queryTokens.size, 1)).toFixed(3)) }
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function splitManuscript(text: string): string[] {
  return text
    .split(/(?<=[.!?。]|다\.)\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 4)
}

export function inspectContinuity(
  text: string,
  lore: Lore[],
  reviews: Record<string, ReviewState> = {},
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = []
  for (const sentence of splitManuscript(text)) {
    for (const result of searchLore(sentence, lore, 3)) {
      const conflict = result.lore.conflictingTerms.find((term) => normalize(sentence).includes(normalize(term)))
      if (!conflict || !normalize(sentence).includes(normalize(result.lore.subject))) continue
      const id = `issue-${result.lore.id}-${hashText(sentence)}`
      issues.push({
        id,
        severity: result.score >= 0.75 ? 'high' : result.score >= 0.45 ? 'medium' : 'low',
        sentence,
        explanation: `“${conflict}” 표현이 정본 설정 “${result.lore.value}”과 충돌할 가능성이 있습니다.`,
        evidence: result.lore,
        score: Math.min(0.99, Number((0.62 + result.score * 0.25).toFixed(2))),
        status: reviews[id] ?? 'pending',
      })
    }
  }
  return [...new Map(issues.map((issue) => [issue.id, issue])).values()]
}

function hashText(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export interface EvaluationResult {
  total: number
  truePositive: number
  trueNegative: number
  falsePositive: number
  falseNegative: number
  precision: number
  recall: number
  accuracy: number
  retrievalHitRate: number
  meanReciprocalRank: number
  latencyMs: number
  estimatedCostUsd: number
  rows: Array<BenchmarkCase & { detected: boolean; retrievedRank: number | null }>
}

export function runEvaluation(cases: BenchmarkCase[], lore: Lore[]): EvaluationResult {
  const start = performance.now()
  const rows = cases.map((testCase) => {
    const detected = inspectContinuity(testCase.sentence, lore).length > 0
    const search = searchLore(testCase.sentence, lore)
    const rank = testCase.expectedLoreId ? search.findIndex((result) => result.lore.id === testCase.expectedLoreId) + 1 : 0
    return { ...testCase, detected, retrievedRank: rank > 0 ? rank : null }
  })
  const truePositive = rows.filter((row) => row.expectedConflict && row.detected).length
  const trueNegative = rows.filter((row) => !row.expectedConflict && !row.detected).length
  const falsePositive = rows.filter((row) => !row.expectedConflict && row.detected).length
  const falseNegative = rows.filter((row) => row.expectedConflict && !row.detected).length
  const expectedRetrieval = rows.filter((row) => row.expectedLoreId)
  const reciprocalRank = expectedRetrieval.reduce((sum, row) => sum + (row.retrievedRank ? 1 / row.retrievedRank : 0), 0)
  return {
    total: rows.length,
    truePositive, trueNegative, falsePositive, falseNegative,
    precision: ratio(truePositive, truePositive + falsePositive),
    recall: ratio(truePositive, truePositive + falseNegative),
    accuracy: ratio(truePositive + trueNegative, rows.length),
    retrievalHitRate: ratio(expectedRetrieval.filter((row) => row.retrievedRank !== null).length, expectedRetrieval.length),
    meanReciprocalRank: ratio(reciprocalRank, expectedRetrieval.length),
    latencyMs: Number((performance.now() - start).toFixed(2)),
    estimatedCostUsd: 0,
    rows,
  }
}

const ratio = (numerator: number, denominator: number) => denominator ? Number((numerator / denominator).toFixed(3)) : 0
