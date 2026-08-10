import { describe, expect, it } from 'vitest'
import { seedDatabase } from '../data/seed'
import { decodeDatabase, encodeDatabase, STORAGE_SCHEMA_VERSION } from './databaseStore'

describe('versioned local workspace storage', () => {
  it('round-trips a schema-versioned database envelope', () => {
    const envelope = encodeDatabase(seedDatabase)
    expect(envelope.schemaVersion).toBe(STORAGE_SCHEMA_VERSION)
    expect(decodeDatabase(envelope).works[0].id).toBe(seedDatabase.works[0].id)
  })

  it('migrates a legacy raw database and initializes v2 lore fields', () => {
    const legacy = structuredClone(seedDatabase)
    delete legacy.lore[0].aliases
    delete legacy.lore[0].semanticPatterns
    const migrated = decodeDatabase(legacy)
    expect(migrated.lore[0].aliases).toEqual(seedDatabase.lore[0].aliases)
    expect(migrated.lore[0].semanticPatterns).toEqual(seedDatabase.lore[0].semanticPatterns)
  })

  it('rejects corrupt storage instead of partially loading it', () => {
    expect(() => decodeDatabase({ works: [] })).toThrow('필수 데이터')
  })
})
