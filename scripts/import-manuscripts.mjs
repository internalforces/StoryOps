#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const repoRoot = path.resolve(import.meta.dirname, '..')
const sourceRoot = path.resolve(process.argv[2] ?? path.join(repoRoot, '..'))
const novelRoot = path.join(sourceRoot, '웹소설')
const characterRoot = path.join(sourceRoot, '등장인물')
const privateRoot = path.join(repoRoot, 'private', 'data')
const workId = 'joseon-future'

const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const pad = (value) => String(value).padStart(4, '0')
const safeName = (value) => value.normalize('NFC').replace(/[^\p{L}\p{N}._-]+/gu, '-')

function classify(name) {
  if (name.includes('완성본')) return 'canon'
  if (name.includes('초안')) return 'draft'
  return 'reference'
}

function splitEpisodes(content, state) {
  const pattern = state === 'canon'
    ? /^##\s+(\d+)화(?:[.\s]|$).*$/gm
    : /^#\s+(\d+)화\s+초안\s*$/gm
  const matches = [...content.matchAll(pattern)]
  return matches.map((match, index) => {
    const start = match.index ?? 0
    const end = matches[index + 1]?.index ?? content.length
    const episode = Number(match[1])
    const body = content.slice(start, end).trim() + '\n'
    const heading = match[0].replace(/^#+\s*/, '').trim()
    return { episode, heading, body }
  })
}

async function listFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true })
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort()
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

await mkdir(path.join(privateRoot, 'episodes'), { recursive: true })
await mkdir(path.join(privateRoot, 'references'), { recursive: true })
await mkdir(path.join(repoRoot, 'public', 'data'), { recursive: true })

const sourceFiles = await listFiles(novelRoot)
const characterFiles = await listFiles(characterRoot)
const records = []
const references = []
const warnings = []

for (const filename of sourceFiles) {
  if (!filename.endsWith('.md')) continue
  const sourcePath = path.join(novelRoot, filename)
  const content = await readFile(sourcePath, 'utf8')
  const state = classify(filename)

  if (state === 'reference') {
    const id = `${workId}-ref-${safeName(filename.replace(/\.md$/i, '')).toLowerCase()}`
    const target = path.join(privateRoot, 'references', `${id}.md`)
    await writeFile(target, content)
    references.push({ id, kind: 'reference', source: filename, sha256: sha256(content) })
    continue
  }

  const episodes = splitEpisodes(content, state)
  if (episodes.length === 0) {
    warnings.push(`${filename}: 회차 머리말을 찾지 못했습니다.`)
    continue
  }

  for (const episode of episodes) {
    const id = `${workId}-ep-${pad(episode.episode)}-${state}`
    const target = path.join(privateRoot, 'episodes', `${id}.md`)
    await writeFile(target, episode.body)
    records.push({
      id,
      workId,
      episode: episode.episode,
      title: episode.heading,
      state,
      visibility: 'private',
      source: filename,
      sha256: sha256(episode.body),
      bytes: Buffer.byteLength(episode.body),
      relativePath: path.relative(repoRoot, target),
    })
  }
}

records.sort((a, b) => a.episode - b.episode || a.state.localeCompare(b.state))
const duplicateIds = records.filter((record, index) => records.findIndex((item) => item.id === record.id) !== index)
if (duplicateIds.length) {
  throw new Error(`안정 ID 중복: ${duplicateIds.map((item) => item.id).join(', ')}`)
}

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  work: { id: workId, title: '조선에 떨어진 미래', visibility: 'private' },
  sources: { manuscriptRoot: novelRoot, characterAssetRoot: characterRoot },
  episodes: records,
  references,
  characterAssets: await Promise.all(characterFiles.map(async (filename) => {
    const bytes = await readFile(path.join(characterRoot, filename))
    return {
      id: `${workId}-asset-${safeName(filename).toLowerCase()}`,
      source: filename,
      visibility: 'private',
      sha256: sha256(bytes),
      bytes: bytes.length,
    }
  })),
  warnings,
}

await writeFile(path.join(privateRoot, 'manifest.private.json'), JSON.stringify(manifest, null, 2) + '\n')

const counts = records.reduce((result, record) => {
  result[record.state] += 1
  return result
}, { draft: 0, canon: 0 })
const publicSummary = {
  schemaVersion: 1,
  workIdRedacted: true,
  importedEpisodeVersions: records.length,
  uniqueEpisodes: new Set(records.map((record) => record.episode)).size,
  draftVersions: counts.draft,
  canonVersions: counts.canon,
  referenceDocuments: references.length,
  privateCharacterAssets: characterFiles.length,
  rawTextPublished: false,
  note: '원고와 파생 데이터는 private/에만 저장되며 공개 저장소에서 제외됩니다.',
}
await writeFile(path.join(repoRoot, 'public', 'data', 'import-summary.json'), JSON.stringify(publicSummary, null, 2) + '\n')

console.log(JSON.stringify(publicSummary, null, 2))
if (warnings.length) console.warn(warnings.join('\n'))
