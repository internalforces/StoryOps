import type {
  BenchmarkCase,
  EvaluationContext,
  EvaluationFailureMode,
  EvaluationOutcome,
} from '../types'

export const failureModeLabels: Record<EvaluationFailureMode, string> = {
  direct_rule: '직접 규칙',
  indirect_expression: '미등록 표현',
  temporal_change: '정상 변화',
  flashback_context: '회상 문맥',
  intentional_lie: '의도적 거짓말',
  unreliable_or_altered_memory: '불확실한 기억',
  alias_resolution: '별칭 연결',
}

const currentNarration: EvaluationContext = { timeline: 'current', speechType: 'narration', reliability: 'reliable' }
const transitionNarration: EvaluationContext = { timeline: 'transition', speechType: 'narration', reliability: 'reliable' }
const pastNarration: EvaluationContext = { timeline: 'past', speechType: 'narration', reliability: 'reliable' }
const deceptiveDialogue: EvaluationContext = { timeline: 'current', speechType: 'dialogue', reliability: 'deceptive' }
const uncertainReport: EvaluationContext = { timeline: 'unknown', speechType: 'reported_speech', reliability: 'uncertain' }

function evaluationCase(
  id: string,
  failureMode: EvaluationFailureMode,
  label: string,
  sentence: string,
  expectedOutcome: EvaluationOutcome,
  context: EvaluationContext,
  expectedLoreId?: string,
  aliases?: string[],
): BenchmarkCase {
  return { id, failureMode, label, sentence, expectedOutcome, context, expectedLoreId, aliases }
}

export const benchmarkCases: BenchmarkCase[] = [
  evaluationCase('direct-01', 'direct_rule', '시간 규칙 충돌', '월문은 한낮에 활짝 열렸다.', 'conflict', currentNarration, 'lore-moon-gate-time'),
  evaluationCase('direct-02', 'direct_rule', '시간 규칙 정상', '자정 종이 울리자 월문이 잠깐 열렸다.', 'consistent', currentNarration, 'lore-moon-gate-time'),
  evaluationCase('direct-03', 'direct_rule', '외형 충돌', '윤슬은 검은 눈으로 봉인을 살폈다.', 'conflict', currentNarration, 'lore-yoonseul-eyes'),
  evaluationCase('direct-04', 'direct_rule', '외형 정상', '윤슬의 은빛 눈이 어둠 속에서 반짝였다.', 'consistent', currentNarration, 'lore-yoonseul-eyes'),
  evaluationCase('direct-05', 'direct_rule', '능력 규칙 충돌', '먹제비는 폭우를 뚫고 높이 날았다.', 'conflict', currentNarration, 'lore-swallow-rain'),
  evaluationCase('direct-06', 'direct_rule', '능력 규칙 정상', '비가 오자 먹제비는 처마 아래 몸을 숨겼다.', 'consistent', currentNarration, 'lore-swallow-rain'),
  evaluationCase('direct-07', 'direct_rule', '공간 구조 충돌', '남쪽 탑의 창문을 열어 바람을 들였다.', 'conflict', currentNarration, 'lore-south-tower-windows'),
  evaluationCase('direct-08', 'direct_rule', '공간 구조 정상', '남쪽 탑의 막힌 벽을 따라 걸었다.', 'consistent', currentNarration, 'lore-south-tower-windows'),
  evaluationCase('direct-09', 'direct_rule', '도구 성질 충돌', '기억나침반은 언제나 북쪽을 향했다.', 'conflict', currentNarration, 'lore-compass-direction'),
  evaluationCase('direct-10', 'direct_rule', '도구 성질 정상', '기억나침반이 잃어버린 기억을 향해 떨렸다.', 'consistent', currentNarration, 'lore-compass-direction'),

  evaluationCase('indirect-01', 'indirect_expression', '간접 시간 표현', '월문은 태양이 머리 위에 걸린 시각 열렸다.', 'conflict', currentNarration, 'lore-moon-gate-time'),
  evaluationCase('indirect-02', 'indirect_expression', '간접 시간 비유', '햇빛이 가장 강해지자 월문이 모습을 드러냈다.', 'conflict', currentNarration, 'lore-moon-gate-time'),
  evaluationCase('indirect-03', 'indirect_expression', '간접 외형 표현', '윤슬의 눈동자는 먹빛처럼 짙었다.', 'conflict', currentNarration, 'lore-yoonseul-eyes'),
  evaluationCase('indirect-04', 'indirect_expression', '외형 비유', '윤슬의 두 눈은 달 없는 밤처럼 어두웠다.', 'conflict', currentNarration, 'lore-yoonseul-eyes'),
  evaluationCase('indirect-05', 'indirect_expression', '창문 우회 표현', '남쪽 탑의 벽에는 투명한 유리 구멍이 나 있었다.', 'conflict', currentNarration, 'lore-south-tower-windows'),
  evaluationCase('indirect-06', 'indirect_expression', '공간 우회 표현', '남쪽 탑의 벽 틈으로 바람과 햇빛이 들어왔다.', 'conflict', currentNarration, 'lore-south-tower-windows'),
  evaluationCase('indirect-07', 'indirect_expression', '비행 간접 표현', '먹제비는 소나기 속에서 지붕보다 높이 비행했다.', 'conflict', currentNarration, 'lore-swallow-rain'),
  evaluationCase('indirect-08', 'indirect_expression', '젖은 날개 비유', '먹제비가 젖은 깃털로 구름 사이를 갈랐다.', 'conflict', currentNarration, 'lore-swallow-rain'),
  evaluationCase('indirect-09', 'indirect_expression', '방향 간접 표현', '기억나침반의 바늘은 북극성 쪽에 고정됐다.', 'conflict', currentNarration, 'lore-compass-direction'),
  evaluationCase('indirect-10', 'indirect_expression', '도구 성질 우회 표현', '기억나침반은 어느 주인이 들어도 같은 방위를 가리켰다.', 'conflict', currentNarration, 'lore-compass-direction'),

  evaluationCase('temporal-01', 'temporal_change', '과거 시간 규칙', '봉인이 바뀌기 전 월문은 한낮에 열렸다.', 'consistent', transitionNarration, 'lore-moon-gate-time'),
  evaluationCase('temporal-02', 'temporal_change', '이전 달력의 규칙', '새 달력이 시행되기 전 월문은 아침마다 열렸다.', 'consistent', transitionNarration, 'lore-moon-gate-time'),
  evaluationCase('temporal-03', 'temporal_change', '치유 전 외형', '저주가 풀리기 전 윤슬은 검은 눈을 지니고 있었다.', 'consistent', transitionNarration, 'lore-yoonseul-eyes'),
  evaluationCase('temporal-04', 'temporal_change', '의식 중 외형 변화', '치유 의식이 이어지는 동안 윤슬의 눈은 푸른 눈으로 변했다.', 'consistent', transitionNarration, 'lore-yoonseul-eyes'),
  evaluationCase('temporal-05', 'temporal_change', '붕괴 전 공간', '무너지기 전 남쪽 탑의 창가에는 화분이 놓여 있었다.', 'consistent', transitionNarration, 'lore-south-tower-windows'),
  evaluationCase('temporal-06', 'temporal_change', '복원 중 공간 변화', '복원 공사 동안 남쪽 탑은 창문을 열어 환기했다.', 'consistent', transitionNarration, 'lore-south-tower-windows'),
  evaluationCase('temporal-07', 'temporal_change', '저주 전 능력', '저주를 받기 전 먹제비는 빗속을 날 수 있었다.', 'consistent', transitionNarration, 'lore-swallow-rain'),
  evaluationCase('temporal-08', 'temporal_change', '치료 후 능력', '치료가 끝난 뒤 먹제비는 폭우를 뚫고 날았다.', 'consistent', transitionNarration, 'lore-swallow-rain'),
  evaluationCase('temporal-09', 'temporal_change', '마법 전 도구', '기억 마법을 받기 전 기억나침반은 항상 북쪽을 가리켰다.', 'consistent', transitionNarration, 'lore-compass-direction'),
  evaluationCase('temporal-10', 'temporal_change', '수리 후 도구', '수리가 끝난 뒤 기억나침반은 남쪽만 가리키도록 바뀌었다.', 'consistent', transitionNarration, 'lore-compass-direction'),

  evaluationCase('flashback-01', 'flashback_context', '회상 속 시간 규칙', '그는 과거를 떠올렸다. 그 시절 월문은 한낮에 열렸다.', 'context_required', pastNarration, 'lore-moon-gate-time'),
  evaluationCase('flashback-02', 'flashback_context', '기록 속 시간 규칙', '오래된 일지에는 월문이 아침에 열렸다고 적혀 있었다.', 'context_required', pastNarration, 'lore-moon-gate-time'),
  evaluationCase('flashback-03', 'flashback_context', '어린 시절 외형', '어린 시절을 회상하자 윤슬의 검은 눈이 먼저 떠올랐다.', 'context_required', pastNarration, 'lore-yoonseul-eyes'),
  evaluationCase('flashback-04', 'flashback_context', '초상화 속 외형', '옛 초상화 속 윤슬은 푸른 눈으로 그려져 있었다.', 'context_required', pastNarration, 'lore-yoonseul-eyes'),
  evaluationCase('flashback-05', 'flashback_context', '과거 공간 증언', '노인은 예전 남쪽 탑의 창문 너머로 불빛을 봤다고 회상했다.', 'context_required', pastNarration, 'lore-south-tower-windows'),
  evaluationCase('flashback-06', 'flashback_context', '옛 지도 속 공간', '백 년 전 지도에는 남쪽 탑의 창가가 표시되어 있었다.', 'context_required', pastNarration, 'lore-south-tower-windows'),
  evaluationCase('flashback-07', 'flashback_context', '과거 생물 능력', '그날의 기억 속에서 먹제비는 빗속을 날고 있었다.', 'context_required', pastNarration, 'lore-swallow-rain'),
  evaluationCase('flashback-08', 'flashback_context', '전설 속 생물 능력', '옛이야기에서는 먹제비가 폭우를 뚫고 산을 넘었다.', 'context_required', pastNarration, 'lore-swallow-rain'),
  evaluationCase('flashback-09', 'flashback_context', '회상 속 도구 성질', '그는 과거 기억나침반이 언제나 북쪽을 향하던 때를 떠올렸다.', 'context_required', pastNarration, 'lore-compass-direction'),
  evaluationCase('flashback-10', 'flashback_context', '기록 속 도구 성질', '낡은 설명서에는 기억나침반이 남쪽만 가리킨다고 쓰여 있었다.', 'context_required', pastNarration, 'lore-compass-direction'),

  evaluationCase('lie-01', 'intentional_lie', '시간 규칙 거짓말', '경비병은 일부러 “월문은 한낮에 열린다”고 말했다.', 'context_required', deceptiveDialogue, 'lore-moon-gate-time'),
  evaluationCase('lie-02', 'intentional_lie', '거짓 시간 안내', '안내인은 침입자를 속이려고 “월문은 아침에만 열린다”고 전했다.', 'context_required', deceptiveDialogue, 'lore-moon-gate-time'),
  evaluationCase('lie-03', 'intentional_lie', '외형 은폐', '윤슬은 정체를 감추며 “내 눈은 검은 눈이다”라고 거짓말했다.', 'context_required', deceptiveDialogue, 'lore-yoonseul-eyes'),
  evaluationCase('lie-04', 'intentional_lie', '허위 외형 증언', '용의자는 윤슬을 숨기려고 “윤슬은 푸른 눈이었다”고 진술했다.', 'context_required', deceptiveDialogue, 'lore-yoonseul-eyes'),
  evaluationCase('lie-05', 'intentional_lie', '공간 구조 기만', '문지기는 통로를 감추며 “남쪽 탑의 창문을 열면 된다”고 속였다.', 'context_required', deceptiveDialogue, 'lore-south-tower-windows'),
  evaluationCase('lie-06', 'intentional_lie', '허위 공간 안내', '첩자는 “남쪽 탑 창가에서 기다리라”고 일부러 잘못 안내했다.', 'context_required', deceptiveDialogue, 'lore-south-tower-windows'),
  evaluationCase('lie-07', 'intentional_lie', '생물 능력 과장', '상인은 값을 올리려고 “먹제비는 빗속을 날 수 있다”고 주장했다.', 'context_required', deceptiveDialogue, 'lore-swallow-rain'),
  evaluationCase('lie-08', 'intentional_lie', '허위 능력 보고', '전령은 실패를 숨기며 “먹제비가 폭우를 뚫고 도착했다”고 보고했다.', 'context_required', deceptiveDialogue, 'lore-swallow-rain'),
  evaluationCase('lie-09', 'intentional_lie', '도구 성질 기만', '사기꾼은 “기억나침반은 항상 북쪽을 가리킨다”고 선전했다.', 'context_required', deceptiveDialogue, 'lore-compass-direction'),
  evaluationCase('lie-10', 'intentional_lie', '허위 사용 설명', '도둑은 추적을 피하려고 “기억나침반은 남쪽만 향한다”고 말했다.', 'context_required', deceptiveDialogue, 'lore-compass-direction'),

  evaluationCase('memory-01', 'unreliable_or_altered_memory', '엇갈린 시간 기억', '한 목격자는 월문이 한낮에 열렸다고 기억했지만 다른 이는 자정을 말했다.', 'context_required', uncertainReport, 'lore-moon-gate-time'),
  evaluationCase('memory-02', 'unreliable_or_altered_memory', '변화한 시간 기억', '그는 처음에는 월문이 아침에 열렸다고 했다가 그런 말을 한 적 없다고 했다.', 'context_required', uncertainReport, 'lore-moon-gate-time'),
  evaluationCase('memory-03', 'unreliable_or_altered_memory', '엇갈린 외형 기억', '증인마다 윤슬을 검은 눈 또는 은빛 눈으로 다르게 기억했다.', 'context_required', uncertainReport, 'lore-yoonseul-eyes'),
  evaluationCase('memory-04', 'unreliable_or_altered_memory', '변조된 외형 기억', '그는 윤슬의 푸른 눈을 봤다고 확신했지만 기억 일부가 지워져 있었다.', 'context_required', uncertainReport, 'lore-yoonseul-eyes'),
  evaluationCase('memory-05', 'unreliable_or_altered_memory', '엇갈린 공간 기억', '누군가는 남쪽 탑의 창문 너머를 봤다 했고 다른 이는 벽뿐이었다고 했다.', 'context_required', uncertainReport, 'lore-south-tower-windows'),
  evaluationCase('memory-06', 'unreliable_or_altered_memory', '변화한 공간 기억', '노인은 남쪽 탑 창가에 섰다고 했다가 탑에 간 적조차 없다고 말을 바꿨다.', 'context_required', uncertainReport, 'lore-south-tower-windows'),
  evaluationCase('memory-07', 'unreliable_or_altered_memory', '엇갈린 능력 기억', '한 사람은 먹제비가 빗속을 날았다고 했고 다른 사람은 숨었다고 기억했다.', 'context_required', uncertainReport, 'lore-swallow-rain'),
  evaluationCase('memory-08', 'unreliable_or_altered_memory', '조작된 비행 기억', '그는 먹제비가 폭우를 뚫고 왔다고 확신했지만 기억에 봉인 흔적이 있었다.', 'context_required', uncertainReport, 'lore-swallow-rain'),
  evaluationCase('memory-09', 'unreliable_or_altered_memory', '엇갈린 방향 기억', '증언자들은 기억나침반이 항상 북쪽 또는 기억을 향했다고 엇갈리게 말했다.', 'context_required', uncertainReport, 'lore-compass-direction'),
  evaluationCase('memory-10', 'unreliable_or_altered_memory', '변화한 도구 기억', '그는 기억나침반이 남쪽만 향했다고 했다가 나침반 자체를 본 적 없다고 했다.', 'context_required', uncertainReport, 'lore-compass-direction'),

  evaluationCase('alias-01', 'alias_resolution', '시간 규칙 별칭 충돌', '달의 문은 한낮에 열렸다.', 'conflict', currentNarration, 'lore-moon-gate-time', ['달의 문']),
  evaluationCase('alias-02', 'alias_resolution', '시간 규칙 별칭 충돌', '은빛 관문은 아침마다 모습을 드러냈다.', 'conflict', currentNarration, 'lore-moon-gate-time', ['은빛 관문']),
  evaluationCase('alias-03', 'alias_resolution', '인물 별칭 충돌', '견습 기록관은 검은 눈으로 봉인을 읽었다.', 'conflict', currentNarration, 'lore-yoonseul-eyes', ['견습 기록관']),
  evaluationCase('alias-04', 'alias_resolution', '공간 별칭 충돌', '남탑의 창문을 열어 연기를 내보냈다.', 'conflict', currentNarration, 'lore-south-tower-windows', ['남탑']),
  evaluationCase('alias-05', 'alias_resolution', '생물 별칭 충돌', '먹빛 제비는 폭우를 뚫고 날아갔다.', 'conflict', currentNarration, 'lore-swallow-rain', ['먹빛 제비']),
  evaluationCase('alias-06', 'alias_resolution', '도구 별칭 충돌', '기억의 바늘은 항상 북쪽을 향했다.', 'conflict', currentNarration, 'lore-compass-direction', ['기억의 바늘']),
  evaluationCase('alias-07', 'alias_resolution', '시간 규칙 별칭 정상', '달의 문은 자정 종이 울린 뒤 열렸다.', 'consistent', currentNarration, 'lore-moon-gate-time', ['달의 문']),
  evaluationCase('alias-08', 'alias_resolution', '인물 별칭 정상', '견습 기록관의 은빛 눈이 어둠 속에서 반짝였다.', 'consistent', currentNarration, 'lore-yoonseul-eyes', ['견습 기록관']),
  evaluationCase('alias-09', 'alias_resolution', '공간 별칭 정상', '남탑의 막힌 벽에는 작은 틈도 없었다.', 'consistent', currentNarration, 'lore-south-tower-windows', ['남탑']),
  evaluationCase('alias-10', 'alias_resolution', '도구 별칭 정상', '기억의 바늘이 주인의 잃어버린 기억을 향해 떨렸다.', 'consistent', currentNarration, 'lore-compass-direction', ['기억의 바늘']),
]
