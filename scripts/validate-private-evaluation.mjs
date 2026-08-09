#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

const repoRoot = path.resolve(import.meta.dirname, '..')
const sourceRoot = path.resolve(repoRoot, '..')
const evidencePath = path.join(repoRoot, 'private', 'evaluation', 'source-cases.private.json')
const expectedModes = new Set([
  'indirect_expression',
  'temporal_change',
  'flashback_context',
  'intentional_lie',
  'unreliable_or_altered_memory',
  'alias_resolution',
])

const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
if (evidence.schemaVersion !== 1 || !Array.isArray(evidence.cases)) throw new Error('비공개 평가 근거 형식이 올바르지 않습니다.')
if (evidence.cases.length !== expectedModes.size) throw new Error('필수 실패 유형이 모두 등록되지 않았습니다.')

const ids = new Set()
for (const testCase of evidence.cases) {
  if (ids.has(testCase.id)) throw new Error(`중복 근거 ID: ${testCase.id}`)
  ids.add(testCase.id)
  if (!expectedModes.delete(testCase.failureMode)) throw new Error(`알 수 없거나 중복된 실패 유형: ${testCase.failureMode}`)
  if (!Array.isArray(testCase.sources) || testCase.sources.length === 0) throw new Error(`${testCase.id}: 근거 파일이 없습니다.`)
  if (typeof testCase.evidenceSummary !== 'string' || !testCase.evidenceSummary) throw new Error(`${testCase.id}: 근거 요약이 없습니다.`)
  for (const source of testCase.sources) {
    if (!Number.isInteger(source.episode) || !Number.isInteger(source.lineStart) || !Number.isInteger(source.lineEnd)) {
      throw new Error(`${testCase.id}: 회차 또는 줄 번호가 올바르지 않습니다.`)
    }
    if (source.lineStart < 1 || source.lineEnd < source.lineStart) throw new Error(`${testCase.id}: 줄 범위가 올바르지 않습니다.`)
    await access(path.join(sourceRoot, source.sourceFile))
  }
}

if (expectedModes.size > 0) throw new Error(`누락된 실패 유형: ${[...expectedModes].join(', ')}`)
console.log(JSON.stringify({ validatedFailureModes: evidence.cases.length, sourceReferences: evidence.cases.reduce((sum, item) => sum + item.sources.length, 0) }))
