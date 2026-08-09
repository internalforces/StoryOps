import { describe, expect, it } from 'vitest'
import { benchmarkCases, seedDatabase } from '../data/seed'
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

  it('passes the bundled regression set', () => {
    const result = runEvaluation(benchmarkCases, seedDatabase.lore)
    expect(result.accuracy).toBe(1)
    expect(result.retrievalHitRate).toBe(1)
  })
})
