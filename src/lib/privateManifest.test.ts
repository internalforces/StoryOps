import { describe, expect, it } from 'vitest'
import { parsePrivateManifest } from './privateManifest'

const manifest = {
  schemaVersion: 1,
  generatedAt: '2026-08-09T09:00:00.000Z',
  work: { id: 'private-work', title: '비공개 작품', visibility: 'private' },
  episodes: [
    {
      id: 'private-work-ep-0001-canon', workId: 'private-work', episode: 1, title: '1화', state: 'canon',
      source: '원본-파일명.md', sha256: 'secret-hash', relativePath: 'private/data/episodes/1.md',
    },
    { id: 'private-work-ep-0001-draft', workId: 'private-work', episode: 1, title: '1화 초안', state: 'draft' },
  ],
  references: [{ id: 'reference-1', source: '설정집.md', sha256: 'reference-hash' }],
  characterAssets: [{ id: 'asset-1', source: '인물.png', sha256: 'asset-hash' }],
}

describe('private manifest adapter', () => {
  it('connects episode metadata without retaining private paths, filenames, or hashes', () => {
    const database = parsePrivateManifest(manifest)
    expect(database.works[0].title).toBe('비공개 작품')
    expect(database.episodes).toHaveLength(2)
    expect(database.source).toMatchObject({
      kind: 'private-manifest', episodeVersions: 2, uniqueEpisodes: 1, referenceDocuments: 1, characterAssets: 1,
    })
    expect(JSON.stringify(database)).not.toContain('원본-파일명.md')
    expect(JSON.stringify(database)).not.toContain('secret-hash')
    expect(JSON.stringify(database)).not.toContain('relativePath')
  })

  it('rejects an unsupported manifest', () => {
    expect(() => parsePrivateManifest({ schemaVersion: 2 })).toThrow('지원하지 않는')
  })
})
