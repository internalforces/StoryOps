import { describe, expect, it } from 'vitest'
import { inspectContinuity } from '../lib/continuity'
import { createScaleDemoDatabase } from './scaleDemo'

describe('120-episode portfolio workflow', () => {
  it('creates 120 unique episodes and 240 stable draft/canon ids without warnings', () => {
    const database = createScaleDemoDatabase()
    expect(database.episodes).toHaveLength(240)
    expect(new Set(database.episodes.map((item) => item.number)).size).toBe(120)
    expect(new Set(database.episodes.map((item) => item.id)).size).toBe(240)
    expect(database.source.integrityWarnings).toBe(0)
  })

  it('connects a scale-demo draft to canon evidence and produces a review candidate', () => {
    const database = createScaleDemoDatabase()
    const draft = database.episodes.find((item) => item.number === 1 && item.state === 'draft')
    const [issue] = inspectContinuity(draft?.content ?? '', database.lore)
    expect(issue.outcome).toBe('conflict')
    expect(issue.evidence.evidenceEpisodeIds[0]).toContain('-canon')
  })
})
