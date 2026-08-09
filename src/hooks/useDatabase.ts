import { useEffect, useState } from 'react'
import { seedDatabase } from '../data/seed'
import { parsePrivateManifest } from '../lib/privateManifest'
import type { Database } from '../types'

const STORAGE_KEY = 'storyops-database-v1'

export function useDatabase() {
  const [database, setDatabase] = useState<Database>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) as Partial<Database> : null
      return parsed ? { ...parsed, source: parsed.source ?? structuredClone(seedDatabase.source) } as Database : structuredClone(seedDatabase)
    } catch {
      return structuredClone(seedDatabase)
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
  }, [database])

  const reset = () => setDatabase(structuredClone(seedDatabase))
  const importPrivateManifest = (contents: string) => {
    const imported = parsePrivateManifest(contents)
    setDatabase(imported)
    return imported.source
  }
  return { database, setDatabase, reset, importPrivateManifest }
}
