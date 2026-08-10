import { seedDatabase } from '../data/seed'
import type { Database } from '../types'

export const STORAGE_SCHEMA_VERSION = 2
const DB_NAME = 'storyops-local'
const STORE_NAME = 'workspace'
const RECORD_KEY = 'active-database'
const LEGACY_KEY = 'storyops-database-v1'

export interface StorageEnvelope {
  schemaVersion: number
  savedAt: string
  database: Database
}

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Database>
  return Array.isArray(candidate.works)
    && Array.isArray(candidate.episodes)
    && Array.isArray(candidate.characters)
    && Array.isArray(candidate.lore)
    && typeof candidate.reviews === 'object'
}

export function encodeDatabase(database: Database): StorageEnvelope {
  return { schemaVersion: STORAGE_SCHEMA_VERSION, savedAt: new Date().toISOString(), database }
}

export function decodeDatabase(value: unknown): Database {
  if (!value || typeof value !== 'object') throw new Error('저장된 워크스페이스 형식이 올바르지 않습니다.')
  const envelope = value as Partial<StorageEnvelope>
  const candidate = envelope.database ?? value
  if (!isDatabase(candidate)) throw new Error('저장된 워크스페이스에 필수 데이터가 없습니다.')
  const isSyntheticDemo = candidate.source?.kind === 'synthetic'
  return {
    ...candidate,
    source: candidate.source ?? structuredClone(seedDatabase.source),
    lore: candidate.lore.map((item) => {
      const demoDefault = isSyntheticDemo ? seedDatabase.lore.find((seed) => seed.id === item.id) : undefined
      return {
        ...item,
        aliases: item.aliases?.length ? item.aliases : (demoDefault?.aliases ?? []),
        semanticPatterns: item.semanticPatterns?.length ? item.semanticPatterns : (demoDefault?.semanticPatterns ?? []),
      }
    }),
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readIndexedDatabase(): Promise<unknown> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(RECORD_KEY)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
  })
}

async function writeIndexedDatabase(value: StorageEnvelope): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(value, RECORD_KEY)
    transaction.oncomplete = () => { database.close(); resolve() }
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadDatabase(): Promise<Database | null> {
  if (typeof indexedDB !== 'undefined') {
    try {
      const stored = await readIndexedDatabase()
      if (stored) return decodeDatabase(stored)
    } catch {
      // A blocked/private browser can still use the legacy local fallback.
    }
  }
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    return legacy ? decodeDatabase(JSON.parse(legacy)) : null
  } catch {
    return null
  }
}

export async function saveDatabase(database: Database): Promise<void> {
  const envelope = encodeDatabase(database)
  if (typeof indexedDB !== 'undefined') {
    try {
      await writeIndexedDatabase(envelope)
      return
    } catch {
      // Preserve edits even if IndexedDB is unavailable.
    }
  }
  localStorage.setItem(LEGACY_KEY, JSON.stringify(envelope))
}
