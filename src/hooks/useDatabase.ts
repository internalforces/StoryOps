import { useEffect, useRef, useState } from 'react'
import { seedDatabase } from '../data/seed'
import { createScaleDemoDatabase } from '../data/scaleDemo'
import { loadDatabase, saveDatabase } from '../lib/databaseStore'
import { parsePrivateManifest } from '../lib/privateManifest'
import type { Database } from '../types'

export function useDatabase() {
  const [database, setDatabase] = useState<Database>(() => structuredClone(seedDatabase))
  const hydrated = useRef(false)

  useEffect(() => {
    let active = true
    void loadDatabase().then((saved) => {
      if (active && saved) setDatabase(saved)
      hydrated.current = true
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (hydrated.current) void saveDatabase(database)
  }, [database])

  const reset = () => setDatabase(structuredClone(seedDatabase))
  const loadScaleDemo = () => setDatabase(createScaleDemoDatabase())
  const importPrivateManifest = (contents: string) => {
    const imported = parsePrivateManifest(contents)
    setDatabase(imported)
    return imported.source
  }
  return { database, setDatabase, reset, loadScaleDemo, importPrivateManifest }
}
