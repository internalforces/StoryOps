import { describe, expect, it } from 'vitest'
import { benchmarkCases } from '../data/evaluation'
import { seedDatabase } from '../data/seed'
import { inferContext, inspectContinuity, runEvaluation, searchLore, splitManuscript } from './continuity'

describe('continuity engine', () => {
  it('splits a manuscript into reviewable sentences', () => {
    expect(splitManuscript('첫 문장이다.\n둘째 문장이다.')).toHaveLength(2)
  })

  it('retrieves the relevant setting with its evidence', () => {
    const [result] = searchLore('월문이 한낮에 열렸다.', seedDatabase.lore)
    expect(result.lore.id).toBe('lore-moon-gate-time')
    expect(result.lore.evidenceEpisodeIds[0]).toBe('twilight-archive-ep-0002-canon')
  })

  it('returns structured conflicts and preserves review state', () => {
    const [issue] = inspectContinuity('월문은 한낮에 활짝 열렸다.', seedDatabase.lore)
    expect(issue.evidence.value).toBe('자정')
    const [reviewed] = inspectContinuity('월문은 한낮에 활짝 열렸다.', seedDatabase.lore, { [issue.id]: 'false_positive' })
    expect(reviewed.status).toBe('false_positive')
  })

  it('improves the same regression suite without rewriting the v1 baseline', () => {
    const legacy = runEvaluation(benchmarkCases, seedDatabase.lore, 'rule-v1')
    const result = runEvaluation(benchmarkCases, seedDatabase.lore, 'rule-v2')
    expect(legacy.passed).toBe(14)
    expect(legacy.contextIdentified).toBe(0)
    expect(result.total).toBe(70)
    expect(result.passed).toBe(70)
    expect(result.contextIdentified).toBe(30)
    expect(result.falsePositive).toBe(0)
    expect(result.falseNegative).toBe(0)
  })

  it('resolves aliases before judging a conflict', () => {
    const [issue] = inspectContinuity('달의 문은 한낮에 열렸다.', seedDatabase.lore)
    expect(issue.evidence.id).toBe('lore-moon-gate-time')
    expect(issue.outcome).toBe('conflict')
  })

  it('routes deceptive and uncertain statements to context review', () => {
    expect(inferContext('경비병은 일부러 거짓말했다.').reliability).toBe('deceptive')
    const [issue] = inspectContinuity('사기꾼은 기억나침반이 항상 북쪽을 향한다고 말했다.', seedDatabase.lore)
    expect(issue.outcome).toBe('context_required')
    expect(issue.contextReason).toContain('거짓말')
  })

  it('does not flag a stated transition as a current continuity error', () => {
    expect(inspectContinuity('봉인이 바뀌기 전 월문은 한낮에 열렸다.', seedDatabase.lore)).toHaveLength(0)
  })

  it('carries an explicit flashback cue into the following sentence', () => {
    const issues = inspectContinuity('그는 과거를 떠올렸다. 그 시절 월문은 한낮에 열렸다.', seedDatabase.lore)
    expect(issues[0].outcome).toBe('context_required')
  })
})
