import type { Database } from '../types'

const now = '2026-08-09T09:00:00.000Z'

export const seedDatabase: Database = {
  source: {
    kind: 'synthetic',
    label: '공개 데모 · 합성 데이터',
    importedAt: now,
    episodeVersions: 4,
    uniqueEpisodes: 4,
    referenceDocuments: 0,
    characterAssets: 0,
  },
  works: [
    {
      id: 'twilight-archive',
      title: '황혼의 기록관',
      logline: '기억을 보관하는 도시에서 견습 기록관이 지워진 하루를 추적한다.',
      genre: '동양 판타지 · 미스터리',
      visibility: 'public',
    },
  ],
  episodes: [
    {
      id: 'twilight-archive-ep-0001-canon', workId: 'twilight-archive', number: 1,
      title: '비가 멎지 않는 날', state: 'canon', visibility: 'public', updatedAt: now,
      synopsis: '윤슬이 기억나침반을 발견하고 기록관에 들어간다.',
      content: '비가 사흘째 내렸다. 윤슬의 은빛 눈에 기억나침반의 바늘이 희미하게 떨렸다.',
    },
    {
      id: 'twilight-archive-ep-0002-canon', workId: 'twilight-archive', number: 2,
      title: '자정의 문', state: 'canon', visibility: 'public', updatedAt: now,
      synopsis: '월문이 자정에만 열린다는 규칙이 드러난다.',
      content: '월문은 자정 종이 울린 뒤 일 분 동안만 열렸다. 남쪽 탑의 벽에는 창문이 하나도 없었다.',
    },
    {
      id: 'twilight-archive-ep-0003-canon', workId: 'twilight-archive', number: 3,
      title: '젖은 날개', state: 'canon', visibility: 'public', updatedAt: now,
      synopsis: '해온의 제비가 빗속에서는 날 수 없다는 사실을 알게 된다.',
      content: '먹구름이 모이자 먹제비는 처마 밑으로 숨었다. 그 새는 비에 젖으면 날지 못했다.',
    },
    {
      id: 'twilight-archive-ep-0004-draft', workId: 'twilight-archive', number: 4,
      title: '한낮의 침입자', state: 'draft', visibility: 'public', updatedAt: now,
      synopsis: '윤슬이 규칙과 어긋나는 증언을 듣는다.',
      content: '초고: 월문은 한낮에 활짝 열렸다. 윤슬은 검은 눈으로 그 광경을 지켜보았다.',
    },
  ],
  characters: [
    { id: 'char-yoonseul', workId: 'twilight-archive', name: '윤슬', role: '견습 기록관', description: '은빛 눈을 지닌 관찰자. 사라진 기억의 결을 본다.', visibility: 'public' },
    { id: 'char-haeon', workId: 'twilight-archive', name: '해온', role: '길잡이', description: '먹제비와 함께 도시의 지붕을 오간다.', visibility: 'public' },
    { id: 'char-muyeong', workId: 'twilight-archive', name: '무영', role: '수석 기록관', description: '기록의 보존을 무엇보다 중시한다.', visibility: 'public' },
  ],
  lore: [
    {
      id: 'lore-moon-gate-time', workId: 'twilight-archive', category: '규칙', subject: '월문', attribute: '개방 시간', value: '자정',
      statement: '월문은 자정 종이 울린 뒤 일 분 동안만 열린다.', conflictingTerms: ['한낮', '정오', '아침'],
      aliases: ['달의 문', '은빛 관문'], semanticPatterns: ['태양이 머리 위', '햇빛이 가장 강', '낮에 열'],
      evidenceEpisodeIds: ['twilight-archive-ep-0002-canon'], visibility: 'public',
    },
    {
      id: 'lore-yoonseul-eyes', workId: 'twilight-archive', category: '인물', subject: '윤슬', attribute: '눈 색', value: '은빛',
      statement: '윤슬의 두 눈은 달빛을 머금은 은빛이다.', conflictingTerms: ['검은 눈', '푸른 눈', '갈색 눈'],
      aliases: ['견습 기록관'], semanticPatterns: ['먹빛처럼 짙', '달 없는 밤처럼 어두'],
      evidenceEpisodeIds: ['twilight-archive-ep-0001-canon'], visibility: 'public',
    },
    {
      id: 'lore-south-tower-windows', workId: 'twilight-archive', category: '장소', subject: '남쪽 탑', attribute: '창문', value: '없음',
      statement: '남쪽 탑에는 창문이 하나도 없다.', conflictingTerms: ['창문을 열', '창문 너머', '창가'],
      aliases: ['남탑'], semanticPatterns: ['투명한 유리 구멍', '벽 틈으로 바람', '벽 틈으로 햇빛'],
      evidenceEpisodeIds: ['twilight-archive-ep-0002-canon'], visibility: 'public',
    },
    {
      id: 'lore-swallow-rain', workId: 'twilight-archive', category: '규칙', subject: '먹제비', attribute: '빗속 비행', value: '불가능',
      statement: '먹제비는 비에 젖으면 날지 못한다.', conflictingTerms: ['빗속을 날', '폭우를 뚫고', '비를 맞으며 날'],
      aliases: ['먹빛 제비'], semanticPatterns: ['소나기 속에서', '젖은 깃털로 구름', '젖은 날개로 날'],
      evidenceEpisodeIds: ['twilight-archive-ep-0003-canon'], visibility: 'public',
    },
    {
      id: 'lore-compass-direction', workId: 'twilight-archive', category: '도구', subject: '기억나침반', attribute: '지시 대상', value: '잃어버린 기억',
      statement: '기억나침반은 북쪽이 아니라 주인이 잃어버린 기억을 가리킨다.', conflictingTerms: ['항상 북쪽', '언제나 북쪽', '북쪽을 향', '자북극', '남쪽만'],
      aliases: ['기억의 바늘'], semanticPatterns: ['북극성 쪽에 고정', '같은 방위를 가리'],
      evidenceEpisodeIds: ['twilight-archive-ep-0001-canon'], visibility: 'public',
    },
  ],
  reviews: {},
}
