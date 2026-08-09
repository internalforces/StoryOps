export type Visibility = 'public' | 'private'
export type EpisodeState = 'draft' | 'canon'
export type ReviewState = 'pending' | 'approved' | 'false_positive'

export interface Work {
  id: string
  title: string
  logline: string
  genre: string
  visibility: Visibility
}

export interface Episode {
  id: string
  workId: string
  number: number
  title: string
  state: EpisodeState
  synopsis: string
  content: string
  visibility: Visibility
  updatedAt: string
}

export interface Character {
  id: string
  workId: string
  name: string
  role: string
  description: string
  visibility: Visibility
}

export interface Lore {
  id: string
  workId: string
  category: '인물' | '장소' | '도구' | '규칙' | '연표'
  subject: string
  attribute: string
  value: string
  statement: string
  conflictingTerms: string[]
  evidenceEpisodeIds: string[]
  visibility: Visibility
}

export interface ContinuityIssue {
  id: string
  severity: 'high' | 'medium' | 'low'
  sentence: string
  explanation: string
  evidence: Lore
  score: number
  status: ReviewState
}

export interface BenchmarkCase {
  id: string
  sentence: string
  expectedConflict: boolean
  expectedLoreId?: string
  label: string
}

export interface DatabaseSource {
  kind: 'synthetic' | 'private-manifest'
  label: string
  importedAt: string
  episodeVersions: number
  uniqueEpisodes: number
  referenceDocuments: number
  characterAssets: number
}

export interface Database {
  works: Work[]
  episodes: Episode[]
  characters: Character[]
  lore: Lore[]
  reviews: Record<string, ReviewState>
  source: DatabaseSource
}
