import { describe, expect, it } from 'vitest'
import { benchmarkCases, failureModeLabels } from './evaluation'

describe('public evaluation dataset', () => {
  it('contains 10 synthetic cases for each of the seven failure modes', () => {
    expect(benchmarkCases).toHaveLength(70)
    for (const failureMode of Object.keys(failureModeLabels)) {
      expect(benchmarkCases.filter((testCase) => testCase.failureMode === failureMode)).toHaveLength(10)
    }
  })

  it('uses unique ids and the intended three-way outcome balance', () => {
    expect(new Set(benchmarkCases.map((testCase) => testCase.id)).size).toBe(benchmarkCases.length)
    expect(benchmarkCases.filter((testCase) => testCase.expectedOutcome === 'conflict')).toHaveLength(21)
    expect(benchmarkCases.filter((testCase) => testCase.expectedOutcome === 'consistent')).toHaveLength(19)
    expect(benchmarkCases.filter((testCase) => testCase.expectedOutcome === 'context_required')).toHaveLength(30)
  })

  it('contains only the public evaluation schema and no source metadata', () => {
    const serialized = JSON.stringify(benchmarkCases)
    for (const privateTerm of ['sourceFile', 'relativePath', 'sha256', 'absolutePath', 'verbatimExcerpt']) {
      expect(serialized).not.toContain(privateTerm)
    }
  })
})
