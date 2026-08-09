import { describe, expect, it } from 'vitest'
import { benchmarkCases } from '../data/evaluation'
import { seedDatabase } from '../data/seed'
import { inspectContinuity, runEvaluation, searchLore, splitManuscript } from './continuity'

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

  it('records the rule-v1 baseline without hiding known failures', () => {
    const result = runEvaluation(benchmarkCases, seedDatabase.lore)
    expect(result.total).toBe(70)
    expect(result.passed).toBeLessThan(result.total)
    expect(result.contextRequired).toBe(30)
    expect(result.contextIdentified).toBe(0)
    expect(result.categories.find((category) => category.failureMode === 'direct_rule')?.passed).toBe(10)
  })
})
