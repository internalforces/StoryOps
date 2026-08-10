import { seedDatabase } from './seed'
import type { Database, Episode } from '../types'

const SCALE_WORK_ID = 'twilight-archive-scale'
const generatedAt = '2026-08-10T00:00:00.000Z'

function episode(number: number, state: Episode['state']): Episode {
  const cycle = ((number - 1) % 5) + 1
  const canonLines = [
    '월문은 자정 종이 울린 뒤 일 분 동안 열렸다.',
    '윤슬의 은빛 눈이 기록 위를 스쳐 갔다.',
    '남쪽 탑의 막힌 벽에는 창문이 없었다.',
    '비가 내리자 먹제비는 처마 아래 숨었다.',
    '기억나침반은 주인이 잃은 기억을 가리켰다.',
  ]
  const draftLines = [
    '월문은 한낮에 잠시 열렸다.',
    '윤슬은 검은 눈으로 정면을 보았다.',
    '남탑의 창문을 열어 바람을 들였다.',
    '먹빛 제비는 폭우를 뚫고 날았다.',
    '기억의 바늘은 항상 북쪽을 향했다.',
  ]
  return {
    id: `${SCALE_WORK_ID}-ep-${String(number).padStart(4, '0')}-${state}`,
    workId: SCALE_WORK_ID,
    number,
    title: `${number}화 · ${state === 'canon' ? '정본' : '초안'} 시나리오`,
    state,
    synopsis: `${cycle}번 설정의 ${state === 'canon' ? '근거' : '충돌 후보'}를 포함한 합성 회차`,
    content: (state === 'canon' ? canonLines : draftLines)[cycle - 1],
    visibility: 'public',
    updatedAt: generatedAt,
  }
}

export function createScaleDemoDatabase(): Database {
  const startedAt = performance.now()
  const episodes = Array.from({ length: 120 }, (_, index) => index + 1)
    .flatMap((number) => [episode(number, 'canon'), episode(number, 'draft')])
  const processingMs = Number((performance.now() - startedAt).toFixed(2))
  return {
    source: {
      kind: 'scale-demo',
      label: '120화 검증 · 합성 데이터',
      importedAt: generatedAt,
      episodeVersions: 240,
      uniqueEpisodes: 120,
      referenceDocuments: 5,
      characterAssets: 6,
      loreCandidates: seedDatabase.lore.length,
      integrityWarnings: 0,
      processingMs,
    },
    works: [{
      id: SCALE_WORK_ID,
      title: '황혼의 기록관 · 120화 검증판',
      logline: '240개 초안·정본 버전을 안정 ID로 연결한 포트폴리오 규모 검증 데모',
      genre: '동양 판타지 · 미스터리',
      visibility: 'public',
    }],
    episodes,
    characters: seedDatabase.characters.map((character) => ({ ...character, workId: SCALE_WORK_ID })),
    lore: seedDatabase.lore.map((item, index) => ({
      ...item,
      id: item.id,
      workId: SCALE_WORK_ID,
      evidenceEpisodeIds: [`${SCALE_WORK_ID}-ep-${String(index + 1).padStart(4, '0')}-canon`],
    })),
    reviews: {},
  }
}
