import type {
  BenchmarkCase,
  ContinuityIssue,
  EvaluationContext,
  EvaluationFailureMode,
  EvaluationOutcome,
  Lore,
  ReviewState,
} from '../types'

export interface SearchResult {
  lore: Lore
  score: number
}

export type EngineId = 'rule-v1' | 'rule-v2'

export interface InspectionOptions {
  engine?: EngineId
  context?: EvaluationContext
  aliases?: string[]
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

function canonicalQuery(query: string, item: Lore, aliases: string[] = []): string {
  const knownAliases = [...(item.aliases ?? []), ...aliases]
  return knownAliases.reduce((result, alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return result.replace(new RegExp(escaped, 'gu'), item.subject)
  }, query)
}

export function searchLore(query: string, lore: Lore[], limit = 5, aliases: string[] = []): SearchResult[] {
  const queryTokens = tokenize(query)
  return lore
    .map((item) => {
      const expandedQuery = canonicalQuery(query, item, aliases)
      const expandedTokens = tokenize(expandedQuery)
      const text = `${item.subject} ${item.aliases?.join(' ') ?? ''} ${item.attribute} ${item.value} ${item.statement} ${item.conflictingTerms.join(' ')} ${item.semanticPatterns?.join(' ') ?? ''}`
      const tokens = tokenize(text)
      const overlap = [...expandedTokens].filter((token) => tokens.has(token)).length
      const subjectBoost = normalize(expandedQuery).includes(normalize(item.subject)) ? 4 : 0
      const allPatterns = [...item.conflictingTerms, ...(item.semanticPatterns ?? [])]
      const termBoost = allPatterns.some((term) => normalize(expandedQuery).includes(normalize(term))) ? 3 : 0
      return { lore: item, score: Number(((overlap + subjectBoost + termBoost) / Math.max(queryTokens.size, 1)).toFixed(3)) }
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function searchLoreV1(query: string, lore: Lore[], limit = 5): SearchResult[] {
  const queryTokens = tokenize(query)
  return lore.map((item) => {
    const text = `${item.subject} ${item.attribute} ${item.value} ${item.statement} ${item.conflictingTerms.join(' ')}`
    const tokens = tokenize(text)
    const overlap = [...queryTokens].filter((token) => tokens.has(token)).length
    const subjectBoost = normalize(query).includes(normalize(item.subject)) ? 4 : 0
    const termBoost = item.conflictingTerms.some((term) => normalize(query).includes(normalize(term))) ? 3 : 0
    return { lore: item, score: Number(((overlap + subjectBoost + termBoost) / Math.max(queryTokens.size, 1)).toFixed(3)) }
  }).filter((result) => result.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
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
  options: InspectionOptions = {},
): ContinuityIssue[] {
  if (options.engine === 'rule-v1') return inspectContinuityV1(text, lore, reviews)
  const issues: ContinuityIssue[] = []
  let carriedContext: EvaluationContext | undefined
  for (const sentence of splitManuscript(text)) {
    const inferred = options.context ?? inferContext(sentence)
    const context = options.context ?? (isNeutralContext(inferred) && carriedContext ? carriedContext : inferred)
    carriedContext = options.context ? undefined : (isNeutralContext(inferred) ? undefined : inferred)
    for (const result of searchLore(sentence, lore, 3, options.aliases)) {
      const expandedSentence = canonicalQuery(sentence, result.lore, options.aliases)
      const patterns = [...result.lore.conflictingTerms, ...(result.lore.semanticPatterns ?? [])]
      const conflict = patterns.find((term) => normalize(expandedSentence).includes(normalize(term)))
      if (!conflict || !normalize(expandedSentence).includes(normalize(result.lore.subject))) continue
      if (context.timeline === 'transition' && context.reliability === 'reliable') continue
      const contextReason = contextExplanation(context)
      const outcome = contextReason ? 'context_required' : 'conflict'
      const id = `issue-${result.lore.id}-${hashText(sentence)}`
      issues.push({
        id,
        severity: result.score >= 0.75 ? 'high' : result.score >= 0.45 ? 'medium' : 'low',
        sentence,
        explanation: outcome === 'context_required'
          ? `“${conflict}” 표현은 정본과 다르지만 ${contextReason}이므로 즉시 오류로 단정하지 않습니다.`
          : `“${conflict}” 표현이 정본 설정 “${result.lore.value}”과 충돌할 가능성이 있습니다.`,
        evidence: result.lore,
        score: Math.min(0.99, Number((0.62 + result.score * 0.25).toFixed(2))),
        status: reviews[id] ?? 'pending',
        outcome,
        contextReason,
      })
    }
  }
  return [...new Map(issues.map((issue) => [issue.id, issue])).values()]
}

export function inspectContinuityV1(
  text: string,
  lore: Lore[],
  reviews: Record<string, ReviewState> = {},
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = []
  for (const sentence of splitManuscript(text)) {
    for (const result of searchLoreV1(sentence, lore, 3)) {
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
        outcome: 'conflict',
      })
    }
  }
  return [...new Map(issues.map((issue) => [issue.id, issue])).values()]
}

const transitionSignals = [/전\s/, /동안/, /끝난 뒤/, /바뀌기 전/, /바뀌었/]
const pastSignals = [/회상/, /과거/, /그 시절/, /오래된/, /예전/, /백 년 전/, /옛이야기/, /낡은/, /어린 시절/, /기억 속/]
const deceptiveSignals = [/일부러/, /속이/, /거짓말/, /감추며/, /숨기려고/, /잘못 안내/, /값을 올리려고/, /추적을 피하려고/, /사기꾼/]
const uncertainSignals = [/다르게 기억/, /엇갈리/, /말을 바꿘/, /지워져/, /봉인 흔적/, /했다가/, /확신했지만/, /목격자/, /증인마다/]

export function inferContext(sentence: string): EvaluationContext {
  if (transitionSignals.some((pattern) => pattern.test(sentence))) return { timeline: 'transition', speechType: 'narration', reliability: 'reliable' }
  if (deceptiveSignals.some((pattern) => pattern.test(sentence))) return { timeline: 'current', speechType: 'dialogue', reliability: 'deceptive' }
  if (uncertainSignals.some((pattern) => pattern.test(sentence))) return { timeline: 'unknown', speechType: 'reported_speech', reliability: 'uncertain' }
  if (pastSignals.some((pattern) => pattern.test(sentence))) return { timeline: 'past', speechType: 'narration', reliability: 'reliable' }
  return { timeline: 'current', speechType: 'narration', reliability: 'reliable' }
}

function contextExplanation(context: EvaluationContext): string | undefined {
  if (context.reliability === 'deceptive') return '의도적 거짓말 또는 기만 문맥'
  if (context.reliability === 'uncertain') return '불확실하거나 변조된 기억 문맥'
  if (context.timeline === 'past') return '과거·회상·기록 문맥'
  if (context.timeline === 'unknown') return '시점을 확정할 수 없는 문맥'
  return undefined
}

function isNeutralContext(context: EvaluationContext): boolean {
  return context.timeline === 'current' && context.speechType === 'narration' && context.reliability === 'reliable'
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
  engineId: EngineId
  total: number
  passed: number
  passRate: number
  truePositive: number
  trueNegative: number
  falsePositive: number
  falseNegative: number
  contextRequired: number
  contextIdentified: number
  precision: number
  recall: number
  retrievalHitRate: number
  meanReciprocalRank: number
  latencyMs: number
  estimatedCostUsd: number
  categories: CategoryEvaluationResult[]
  rows: Array<BenchmarkCase & {
    detected: boolean
    predictedOutcome: EvaluationOutcome
    passed: boolean
    retrievedRank: number | null
  }>
}

export interface CategoryEvaluationResult {
  failureMode: EvaluationFailureMode
  total: number
  passed: number
  passRate: number
  falsePositive: number
  falseNegative: number
  contextMisses: number
}

export function runEvaluation(cases: BenchmarkCase[], lore: Lore[], engineId: EngineId = 'rule-v2'): EvaluationResult {
  const start = performance.now()
  const rows = cases.map((testCase) => {
    const issues = engineId === 'rule-v1'
      ? inspectContinuityV1(testCase.sentence, lore)
      : inspectContinuity(testCase.sentence, lore, {}, { context: testCase.context, aliases: testCase.aliases })
    const detected = issues.length > 0
    const predictedOutcome: EvaluationOutcome = issues[0]?.outcome ?? 'consistent'
    const search = engineId === 'rule-v1' ? searchLoreV1(testCase.sentence, lore) : searchLore(testCase.sentence, lore, 5, testCase.aliases)
    const rank = testCase.expectedLoreId ? search.findIndex((result) => result.lore.id === testCase.expectedLoreId) + 1 : 0
    return {
      ...testCase,
      detected,
      predictedOutcome,
      passed: predictedOutcome === testCase.expectedOutcome,
      retrievedRank: rank > 0 ? rank : null,
    }
  })
  const truePositive = rows.filter((row) => row.expectedOutcome === 'conflict' && row.detected).length
  const trueNegative = rows.filter((row) => row.expectedOutcome === 'consistent' && !row.detected).length
  const falsePositive = rows.filter((row) => row.expectedOutcome === 'consistent' && row.detected).length
  const falseNegative = rows.filter((row) => row.expectedOutcome === 'conflict' && !row.detected).length
  const contextRequired = rows.filter((row) => row.expectedOutcome === 'context_required').length
  const contextIdentified = rows.filter((row) => row.expectedOutcome === 'context_required' && row.predictedOutcome === 'context_required').length
  const passed = rows.filter((row) => row.passed).length
  const expectedRetrieval = rows.filter((row) => row.expectedLoreId)
  const reciprocalRank = expectedRetrieval.reduce((sum, row) => sum + (row.retrievedRank ? 1 / row.retrievedRank : 0), 0)
  const failureModes = [...new Set(cases.map((testCase) => testCase.failureMode))]
  const categories = failureModes.map((failureMode) => {
    const categoryRows = rows.filter((row) => row.failureMode === failureMode)
    const categoryPassed = categoryRows.filter((row) => row.passed).length
    return {
      failureMode,
      total: categoryRows.length,
      passed: categoryPassed,
      passRate: ratio(categoryPassed, categoryRows.length),
      falsePositive: categoryRows.filter((row) => row.expectedOutcome === 'consistent' && row.detected).length,
      falseNegative: categoryRows.filter((row) => row.expectedOutcome === 'conflict' && !row.detected).length,
      contextMisses: categoryRows.filter((row) => row.expectedOutcome === 'context_required' && row.predictedOutcome !== 'context_required').length,
    }
  })
  return {
    engineId,
    total: rows.length,
    passed,
    passRate: ratio(passed, rows.length),
    truePositive, trueNegative, falsePositive, falseNegative,
    contextRequired,
    contextIdentified,
    precision: ratio(truePositive, truePositive + falsePositive),
    recall: ratio(truePositive, truePositive + falseNegative),
    retrievalHitRate: ratio(expectedRetrieval.filter((row) => row.retrievedRank !== null).length, expectedRetrieval.length),
    meanReciprocalRank: ratio(reciprocalRank, expectedRetrieval.length),
    latencyMs: Number((performance.now() - start).toFixed(2)),
    estimatedCostUsd: 0,
    categories,
    rows,
  }
}

const ratio = (numerator: number, denominator: number) => denominator ? Number((numerator / denominator).toFixed(3)) : 0
