import { useEffect, useState } from 'react'
import { seedDatabase } from '../data/seed'
import type { Database } from '../types'

const STORAGE_KEY = 'storyops-database-v1'

export function useDatabase() {
  const [database, setDatabase] = useState<Database>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : structuredClone(seedDatabase)
    } catch {
      return structuredClone(seedDatabase)
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
  }, [database])

  const reset = () => setDatabase(structuredClone(seedDatabase))
  return { database, setDatabase, reset }
}
