import type { Database, DatabaseSource, Episode, EpisodeState } from '../types'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(record: JsonRecord, key: string): string {
  const value = record[key]
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`매니페스트의 ${key} 값이 올바르지 않습니다.`)
  return value
}

function optionalArray(record: JsonRecord, key: string): unknown[] {
  const value = record[key]
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error(`매니페스트의 ${key} 값은 배열이어야 합니다.`)
  return value
}

function episodeFromRecord(value: unknown, workId: string, importedAt: string): Episode {
  if (!isRecord(value)) throw new Error('회차 레코드 형식이 올바르지 않습니다.')
  const number = value.episode
  const state = value.state
  if (typeof number !== 'number' || !Number.isInteger(number) || number < 1) throw new Error('회차 번호가 올바르지 않습니다.')
  if (state !== 'draft' && state !== 'canon') throw new Error('회차 상태는 draft 또는 canon이어야 합니다.')

  return {
    id: requiredString(value, 'id'),
    workId,
    number,
    title: requiredString(value, 'title'),
    state: state as EpisodeState,
    synopsis: '로컬 비공개 매니페스트에서 불러온 회차 메타데이터',
    content: '',
    visibility: 'private',
    updatedAt: importedAt,
  }
}

export function parsePrivateManifest(input: string | unknown): Database {
  let parsed: unknown
  try {
    parsed = typeof input === 'string' ? JSON.parse(input) : input
  } catch {
    throw new Error('JSON 파일을 읽을 수 없습니다.')
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== 1) throw new Error('지원하지 않는 비공개 매니페스트 형식입니다.')
  if (!isRecord(parsed.work)) throw new Error('작품 정보가 없습니다.')

  const workId = requiredString(parsed.work, 'id')
  const workTitle = requiredString(parsed.work, 'title')
  const importedAt = typeof parsed.generatedAt === 'string' ? parsed.generatedAt : new Date().toISOString()
  const episodeValues = optionalArray(parsed, 'episodes')
  const episodes = episodeValues.map((episode) => episodeFromRecord(episode, workId, importedAt))
  const ids = new Set(episodes.map((episode) => episode.id))
  if (ids.size !== episodes.length) throw new Error('중복된 회차 ID가 있습니다.')

  const source: DatabaseSource = {
    kind: 'private-manifest',
    label: '로컬 연결 · 비공개 매니페스트',
    importedAt,
    episodeVersions: episodes.length,
    uniqueEpisodes: new Set(episodes.map((episode) => episode.number)).size,
    referenceDocuments: optionalArray(parsed, 'references').length,
    characterAssets: optionalArray(parsed, 'characterAssets').length,
  }

  return {
    source,
    works: [{
      id: workId,
      title: workTitle,
      logline: '로컬 비공개 매니페스트에서 불러온 작품입니다. 원문은 브라우저에 저장하지 않습니다.',
      genre: '비공개 원고',
      visibility: 'private',
    }],
    episodes,
    characters: [],
    lore: [],
    reviews: {},
  }
}
