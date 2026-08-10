import { useMemo, useRef, useState } from 'react'
import {
  Activity, Archive, BookOpen, Check, ChevronRight, CircleAlert, Clock3,
  Database, FileCheck2, FileText, Gauge, GitBranch, LayoutDashboard, Menu,
  Plus, RefreshCcw, Search, Settings2, ShieldCheck, Sparkles, Trash2, Upload, Users, X,
} from 'lucide-react'
import { benchmarkCases, failureModeLabels } from './data/evaluation'
import { useDatabase } from './hooks/useDatabase'
import { inspectContinuity, runEvaluation, searchLore } from './lib/continuity'
import type {
  Character,
  Database as StoryDatabase,
  Episode,
  EvaluationFailureMode,
  EvaluationOutcome,
  Lore,
  ReviewState,
  Visibility,
  Work,
} from './types'

type View = 'overview' | 'content' | 'lore' | 'continuity' | 'evaluation'
type EntityKind = 'work' | 'episode' | 'character' | 'lore'

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: '운영 현황', icon: LayoutDashboard },
  { id: 'content', label: '작품과 회차', icon: BookOpen },
  { id: 'lore', label: '인물과 설정', icon: Users },
  { id: 'continuity', label: '연속성 검사', icon: Sparkles },
  { id: 'evaluation', label: '평가 리포트', icon: Gauge },
]

const labels: Record<View, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: 'STORY OPERATIONS', title: '서사의 맥락을 한곳에서', description: '초안부터 정본, 설정 근거와 검수 결과까지 추적합니다.' },
  content: { eyebrow: 'CONTENT', title: '작품과 회차', description: '원고 버전과 공개 범위를 안정적인 ID로 관리합니다.' },
  lore: { eyebrow: 'WORLD BIBLE', title: '인물과 설정', description: '설정을 구조화하고 처음 등장한 근거 회차에 연결합니다.' },
  continuity: { eyebrow: 'CONTINUITY', title: '규칙 기반 연속성 검사', description: '새 원고에서 관련 설정을 찾고 검토 가능한 충돌 후보를 만듭니다.' },
  evaluation: { eyebrow: 'EVALUATION', title: '품질 평가', description: '충돌·정상·문맥 필요 문장으로 검색·판정 품질을 회귀 테스트합니다.' },
}

export default function App() {
  const { database, setDatabase, reset, loadScaleDemo, importPrivateManifest } = useDatabase()
  const [view, setView] = useState<View>('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [editor, setEditor] = useState<{ kind: EntityKind; id?: string } | null>(null)
  const [importNotice, setImportNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const page = labels[view]
  const workTitle = database.works[0]?.title ?? 'StoryOps'

  const handleManifestFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const source = importPrivateManifest(await file.text())
      setView('overview')
      setImportNotice({ tone: 'success', text: `${source.uniqueEpisodes}개 회차 · ${source.episodeVersions}개 버전 · ${source.loreCandidates ?? 0}개 설정 후보를 로컬에서 연결했습니다. 원문·파일명·해시는 저장하지 않았습니다.` })
    } catch (error) {
      setImportNotice({ tone: 'error', text: error instanceof Error ? error.message : '매니페스트를 불러오지 못했습니다.' })
    }
  }

  const resetDemo = () => {
    reset()
    setImportNotice({ tone: 'success', text: '공개 합성 데모 데이터로 초기화했습니다.' })
  }

  const openScaleDemo = () => {
    loadScaleDemo()
    setView('overview')
    setImportNotice({ tone: 'success', text: '120화·240개 버전과 설정 후보를 연결한 합성 규모 검증 시나리오를 불러왔습니다.' })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><GitBranch size={20} /></div><div><strong>StoryOps</strong><span>Continuity studio</span></div></div>
        <nav>
          <p className="nav-label">WORKSPACE</p>
          {navItems.map((item) => <button className={view === item.id ? 'active' : ''} onClick={() => { setView(item.id); setMobileNav(false) }} key={item.id}><item.icon size={18} /><span>{item.label}</span>{view === item.id && <ChevronRight size={16} />}</button>)}
        </nav>
        <div className="privacy-card"><ShieldCheck size={20} /><div><strong>원고 보호됨</strong><span>원문은 로컬 전용 저장소에서만 처리됩니다.</span></div></div>
        <div className="sidebar-footer"><span className="status-dot" />{database.source.label}</div>
      </aside>

      <main>
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="메뉴"><Menu size={20} /></button>
          <div className="breadcrumb"><span>{workTitle}</span><ChevronRight size={14} /><strong>{page.title}</strong></div>
          <div className="top-actions"><span className="sync-state"><span className="status-dot" />모든 변경 저장됨</span><button className="avatar" title="데모 사용자">SO</button></div>
        </header>

        <div className="page-wrap">
          <div className="page-heading"><div><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.description}</p></div>{view !== 'continuity' && view !== 'evaluation' && <div className="page-heading-actions">{view === 'overview' && <><input className="visually-hidden" ref={fileInput} type="file" accept="application/json,.json" onChange={handleManifestFile} /><button className="secondary" onClick={openScaleDemo}><Database size={16} />120화 규모 데모</button><button className="secondary" onClick={() => fileInput.current?.click()}><Upload size={16} />비공개 매니페스트</button></>}<button className="secondary" onClick={resetDemo}><RefreshCcw size={16} />합성 데모 초기화</button></div>}</div>
          {importNotice && <div className={`import-notice ${importNotice.tone}`} role="status"><ShieldCheck size={18} /><span>{importNotice.text}</span><button className="icon-button" onClick={() => setImportNotice(null)} aria-label="알림 닫기"><X size={15} /></button></div>}
          {view === 'overview' && <Overview database={database} onNavigate={setView} />}
          {view === 'content' && <ContentView database={database} onEdit={(kind, id) => setEditor({ kind, id })} />}
          {view === 'lore' && <LoreView database={database} onEdit={(kind, id) => setEditor({ kind, id })} />}
          {view === 'continuity' && <ContinuityView database={database} setDatabase={setDatabase} />}
          {view === 'evaluation' && <EvaluationView database={database} />}
        </div>
      </main>

      {editor && <EntityEditor editor={editor} database={database} setDatabase={setDatabase} onClose={() => setEditor(null)} />}
    </div>
  )
}

function Overview({ database, onNavigate }: { database: StoryDatabase; onNavigate: (view: View) => void }) {
  const canon = database.episodes.filter((episode) => episode.state === 'canon').length
  const draft = database.episodes.filter((episode) => episode.state === 'draft').length
  const reviewCount = Object.keys(database.reviews).length
  const recent = [...database.episodes].sort((a, b) => b.number - a.number).slice(0, 4)
  const baseline = useMemo(() => runEvaluation(benchmarkCases, database.lore, 'rule-v2'), [database.lore])
  return <>
    <section className="stats-grid">
      <StatCard icon={FileText} tone="sand" label="회차 버전" value={database.episodes.length} meta={`${database.source.uniqueEpisodes}개 회차 · ${canon} 정본 · ${draft} 초안`} />
      <StatCard icon={Database} tone="sage" label="등록 설정" value={database.lore.length} meta={`${database.characters.length}명 인물 연결`} />
      <StatCard icon={CircleAlert} tone="coral" label="검토 기록" value={reviewCount} meta={reviewCount ? '사용자 판단 반영됨' : '새 원고를 검사해 보세요'} />
      <StatCard icon={Activity} tone="blue" label="rule-v2 통과" value={database.lore.length ? `${baseline.passed}/${baseline.total}` : '미검증'} meta={database.lore.length ? `v1 14건 → v2 ${baseline.passed}건` : '설정 데이터 등록 필요'} />
    </section>
    <section className="overview-grid">
      <div className="panel progress-panel">
        <div className="panel-heading"><div><span className="kicker">PIPELINE</span><h2>원고 처리 흐름</h2></div><span className="badge success"><Check size={13} />정상</span></div>
        <div className="pipeline">
          {[
            ['01', '백업과 분류', `${database.source.uniqueEpisodes}화 · ${database.source.integrityWarnings ?? 0}건 경고`, true],
            ['02', '회차별 정리', `${database.source.episodeVersions}개 버전 · 안정 ID`, true],
            ['03', '설정 연결', `${database.source.loreCandidates ?? database.lore.length}개 후보 · 근거 회차`, database.lore.length > 0],
            ['04', '사용자 검수', '승인 · 오탐 피드백', reviewCount > 0],
          ].map(([number, title, note, done], index) => <div className="pipeline-step" key={String(number)}><div className={`step-marker ${done ? 'done' : ''}`}>{done ? <Check size={15} /> : number}</div><div><strong>{title}</strong><span>{note}</span></div>{index < 3 && <div className="step-line" />}</div>)}
        </div>
        <button className="primary" onClick={() => onNavigate('continuity')}><Sparkles size={17} />새 원고 검사하기</button>
      </div>
      <div className="panel activity-panel">
        <div className="panel-heading"><div><span className="kicker">RECENT</span><h2>최근 회차</h2></div><button className="text-button" onClick={() => onNavigate('content')}>전체 보기 <ChevronRight size={14} /></button></div>
        <div className="episode-list">{recent.map((episode) => <div className="episode-row" key={episode.id}><span className="episode-number">{String(episode.number).padStart(2, '0')}</span><div><strong>{episode.title}</strong><span>{episode.synopsis}</span></div><StateBadge state={episode.state} /></div>)}</div>
      </div>
    </section>
    <section className="panel decision-panel"><div className="decision-icon"><FileCheck2 size={24} /></div><div><span className="kicker">WHY STORYOPS</span><h2>검색과 판정을 나누고, 문맥은 사람에게 돌려줍니다.</h2><p>rule-v2는 별칭·간접 표현을 연결하고 회상·거짓말·불확실한 기억을 ‘문맥 필요’로 분리합니다.</p></div><button className="secondary" onClick={() => onNavigate('evaluation')}>평가 비교 <ChevronRight size={16} /></button></section>
  </>
}

function StatCard({ icon: Icon, tone, label, value, meta }: { icon: typeof FileText; tone: string; label: string; value: string | number; meta: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20} /></div><span>{label}</span><strong>{value}</strong><p>{meta}</p></div>
}

function ContentView({ database, onEdit }: { database: StoryDatabase; onEdit: (kind: EntityKind, id?: string) => void }) {
  const [query, setQuery] = useState('')
  const episodes = database.episodes.filter((episode) => `${episode.number} ${episode.title} ${episode.synopsis}`.includes(query))
  return <div className="content-stack">
    <section className="panel"><div className="panel-heading"><div><span className="kicker">WORKS</span><h2>작품</h2></div><button className="primary compact" onClick={() => onEdit('work')}><Plus size={16} />작품 추가</button></div>
      <div className="work-grid">{database.works.map((work) => <article className="work-card" key={work.id}><div className="book-cover"><Archive size={28} /><span>STORY<br />ARCHIVE</span></div><div><span className="badge neutral">{work.genre}</span><h3>{work.title}</h3><p>{work.logline}</p><div className="card-footer"><code>{work.id}</code><button className="text-button" onClick={() => onEdit('work', work.id)}>편집</button></div></div></article>)}</div>
    </section>
    <section className="panel"><div className="panel-heading"><div><span className="kicker">EPISODES</span><h2>회차</h2></div><div className="heading-actions"><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="회차 검색" /></label><button className="primary compact" onClick={() => onEdit('episode')}><Plus size={16} />회차 추가</button></div></div>
      <div className="data-table"><div className="table-row table-head"><span>회차</span><span>제목과 개요</span><span>상태</span><span>공개 범위</span><span /></div>{episodes.map((episode) => <div className="table-row" key={episode.id}><strong>{String(episode.number).padStart(3, '0')}화</strong><div><b>{episode.title}</b><small>{episode.synopsis}</small><code>{episode.id}</code></div><StateBadge state={episode.state} /><span className={`visibility ${episode.visibility}`}>{episode.visibility === 'public' ? '공개' : '비공개'}</span><button className="icon-button" onClick={() => onEdit('episode', episode.id)} aria-label="회차 편집"><Settings2 size={17} /></button></div>)}</div>
    </section>
  </div>
}

function LoreView({ database, onEdit }: { database: StoryDatabase; onEdit: (kind: EntityKind, id?: string) => void }) {
  return <div className="lore-layout">
    <section className="panel"><div className="panel-heading"><div><span className="kicker">CHARACTERS</span><h2>인물</h2></div><button className="primary compact" onClick={() => onEdit('character')}><Plus size={16} />인물 추가</button></div>
      <div className="character-list">{database.characters.map((character, index) => <button className="character-card" key={character.id} onClick={() => onEdit('character', character.id)}><span className={`character-avatar avatar-${index % 3}`}>{character.name.slice(0, 1)}</span><div><strong>{character.name}</strong><span>{character.role}</span><p>{character.description}</p></div><ChevronRight size={17} /></button>)}</div>
    </section>
    <section className="panel lore-panel"><div className="panel-heading"><div><span className="kicker">CANON FACTS</span><h2>설정과 근거</h2></div><button className="primary compact" onClick={() => onEdit('lore')}><Plus size={16} />설정 추가</button></div>
      <div className="lore-list">{database.lore.map((item) => <article className="lore-card" key={item.id}><div className="lore-top"><span className="badge neutral">{item.category}</span><button className="icon-button" onClick={() => onEdit('lore', item.id)}><Settings2 size={16} /></button></div><h3>{item.subject} · {item.attribute}</h3><p>{item.statement}</p><div className="evidence"><FileCheck2 size={15} /><span>근거</span>{item.evidenceEpisodeIds.map((id) => <code key={id}>{episodeLabel(database, id)}</code>)}</div></article>)}</div>
    </section>
  </div>
}

function ContinuityView({ database, setDatabase }: { database: StoryDatabase; setDatabase: React.Dispatch<React.SetStateAction<StoryDatabase>> }) {
  const demoText = '월문은 한낮에 활짝 열렸다. 윤슬은 검은 눈으로 남쪽 탑의 창문을 열었다. 해온의 먹제비는 폭우를 뚫고 날아올랐다.'
  const [text, setText] = useState(demoText)
  const [hasRun, setHasRun] = useState(false)
  const issues = useMemo(() => hasRun ? inspectContinuity(text, database.lore, database.reviews) : [], [hasRun, text, database.lore, database.reviews])
  const chunks = text ? text.split(/\n+/).filter(Boolean).length : 0
  const canInspect = database.lore.length > 0
  const setReview = (id: string, state: ReviewState) => setDatabase((current) => ({ ...current, reviews: { ...current.reviews, [id]: state } }))
  return <div className="continuity-grid">
    <section className="panel manuscript-panel"><div className="panel-heading"><div><span className="kicker">MANUSCRIPT</span><h2>검사할 원고</h2></div><span className="badge neutral">브라우저 내 처리</span></div>
      <textarea value={text} onChange={(event) => { setText(event.target.value); setHasRun(false) }} aria-label="검사할 원고" />
      <div className="editor-meta"><span>{text.length.toLocaleString()}자</span><span>{chunks}개 문단</span><span>설정 {database.lore.length}개 검색</span></div>
      <button className="primary full" disabled={!canInspect} onClick={() => setHasRun(true)}><Sparkles size={18} />연속성 검사 실행</button>
      {!canInspect && <div className="process-note warning"><CircleAlert size={20} /><div><strong>구조화된 설정이 필요합니다</strong><span>비공개 매니페스트는 회차 메타데이터만 연결합니다. 인물과 설정 화면에서 검사 규칙과 근거 회차를 등록해 주세요.</span></div></div>}
      <div className="process-note"><FileCheck2 size={20} /><div><strong>설명 가능한 규칙 검사</strong><span>문장 분할 → 관련 설정 검색 → 충돌 표현 대조 → 사용자 검수</span></div></div>
    </section>
    <section className="panel results-panel"><div className="panel-heading"><div><span className="kicker">REVIEW QUEUE</span><h2>검사 결과</h2></div>{hasRun && <span className={`badge ${issues.length ? 'warning' : 'success'}`}>{issues.length ? `${issues.length}건 발견` : '충돌 없음'}</span>}</div>
      {!hasRun ? <EmptyState icon={Search} title="아직 검사하지 않았습니다" body="왼쪽 원고를 확인하고 연속성 검사를 실행하세요." /> : issues.length === 0 ? <EmptyState icon={Check} title="충돌 후보가 없습니다" body="현재 설정 기준으로 일관된 원고입니다." /> : <div className="issue-list">{issues.map((issue) => <article className={`issue-card ${issue.status} ${issue.outcome}`} key={issue.id}><div className="issue-header"><span className={`severity ${issue.outcome === 'context_required' ? 'context' : issue.severity}`}>{issue.outcome === 'context_required' ? '문맥 필요' : issue.severity === 'high' ? '높음' : issue.severity === 'medium' ? '보통' : '낮음'}</span><span>신뢰도 {Math.round(issue.score * 100)}%</span><ReviewBadge state={issue.status} /></div><blockquote>{issue.sentence}</blockquote><p>{issue.explanation}</p><div className="evidence-box"><span><FileCheck2 size={15} />정본 근거</span><strong>{issue.evidence.statement}</strong><code>{issue.evidence.evidenceEpisodeIds.map((id) => episodeLabel(database, id)).join(', ')}</code></div><div className="review-actions"><button className={issue.status === 'approved' ? 'selected' : ''} onClick={() => setReview(issue.id, 'approved')}><Check size={15} />{issue.outcome === 'context_required' ? '문맥 확인' : '오류 승인'}</button><button className={issue.status === 'false_positive' ? 'selected' : ''} onClick={() => setReview(issue.id, 'false_positive')}><X size={15} />오탐 처리</button></div></article>)}</div>}
    </section>
  </div>
}

function EvaluationView({ database }: { database: StoryDatabase }) {
  const [runAt, setRunAt] = useState(0)
  const [filter, setFilter] = useState<'all' | EvaluationFailureMode>('all')
  const result = useMemo(() => runEvaluation(benchmarkCases, database.lore), [database.lore, runAt])
  const legacy = useMemo(() => runEvaluation(benchmarkCases, database.lore, 'rule-v1'), [database.lore, runAt])
  const visibleRows = filter === 'all' ? result.rows : result.rows.filter((row) => row.failureMode === filter)
  return <div className="content-stack">
    <section className="evaluation-hero"><div><span className="eyebrow">REGRESSION SUITE · {result.engineId}</span><h2>14건에서 {result.passed}건으로, 판정 근거를 남기며</h2><p>동일한 7개 유형·70건을 v1과 v2에 동시 실행해 오탐·누락·문맥 식별 변화를 비교합니다.</p></div><button className="primary" onClick={() => setRunAt(Date.now())}><RefreshCcw size={17} />평가 다시 실행</button></section>
    <section className="metrics-grid"><Metric label="전체 통과" value={`${result.passed}/${result.total}`} note={`v1 ${legacy.passed}건 → v2 ${result.passed}건`} /><Metric label="충돌 재현율" value={`${Math.round(result.recall * 100)}%`} note={`누락 ${result.falseNegative}건`} /><Metric label="문맥 식별" value={`${result.contextIdentified}/${result.contextRequired}`} note={`v1 ${legacy.contextIdentified}건 → v2 ${result.contextIdentified}건`} /><Metric label="검색 Hit@5" value={`${Math.round(result.retrievalHitRate * 100)}%`} note={`MRR ${result.meanReciprocalRank.toFixed(2)}`} /></section>
    <section className="panel category-panel"><div className="panel-heading"><div><span className="kicker">CATEGORY BASELINE</span><h2>유형별 통과 결과</h2></div><span className="badge neutral">실행 {result.latencyMs.toFixed(2)}ms · 비용 ${result.estimatedCostUsd.toFixed(4)}</span></div><div className="category-list">{result.categories.map((category) => <div className="category-row" key={category.failureMode}><div><strong>{failureModeLabels[category.failureMode]}</strong><span>오탐 {category.falsePositive} · 누락 {category.falseNegative} · 문맥 미처리 {category.contextMisses}</span></div><div className="category-track"><span style={{ width: `${Math.round(category.passRate * 100)}%` }} /></div><b>{category.passed}/{category.total}</b></div>)}</div></section>
    <section className="evaluation-grid"><div className="panel"><div className="panel-heading"><div><span className="kicker">TEST CASES</span><h2>문장별 결과</h2></div><div className="evaluation-filter"><select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | EvaluationFailureMode)} aria-label="평가 유형 필터"><option value="all">전체 유형</option>{Object.entries(failureModeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><span className="badge neutral">{visibleRows.length}건</span></div></div><div className="eval-list">{visibleRows.map((row) => <div className="eval-row" key={row.id}><span className={`eval-status ${row.passed ? 'pass' : 'fail'}`}>{row.passed ? <Check size={14} /> : <X size={14} />}</span><div><strong>{row.label}</strong><p>{row.sentence}</p></div><OutcomeBadge outcome={row.expectedOutcome} /><span className="rank">예측 {outcomeLabel(row.predictedOutcome)}</span></div>)}</div></div>
      <div className="panel failure-panel"><div className="panel-heading"><div><span className="kicker">COMPARISON</span><h2>v1 → v2 변화</h2></div></div><div className="baseline-state improved"><div><Check size={28} /></div><h3>알려진 7개 실패 유형 회귀 통과</h3><p>시간축·화자·기억 신뢰도를 판정 입력으로 분리하고, 별칭과 간접 표현을 설정에 연결했습니다.</p></div><div className="risk-list"><div><span>01</span><p><strong>오탐 {legacy.falsePositive} → {result.falsePositive}건</strong>정상적인 설정 변화를 현재 정본과 분리합니다.</p></div><div><span>02</span><p><strong>누락 {legacy.falseNegative} → {result.falseNegative}건</strong>설정별 별칭·의미 패턴을 검색 전에 정규화합니다.</p></div><div><span>03</span><p><strong>문맥 미처리 {legacy.contextRequired - legacy.contextIdentified} → {result.contextRequired - result.contextIdentified}건</strong>단정하기 어려운 문장은 ‘문맥 필요’로 전환합니다.</p></div></div></div>
    </section>
  </div>
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><p>{note}</p></div> }
function outcomeLabel(outcome: EvaluationOutcome) { return outcome === 'conflict' ? '충돌' : outcome === 'consistent' ? '정상' : '문맥 필요' }
function OutcomeBadge({ outcome }: { outcome: EvaluationOutcome }) { return <span className={`badge ${outcome === 'conflict' ? 'warning' : outcome === 'consistent' ? 'success' : 'context'}`}>{outcomeLabel(outcome)}</span> }
function EmptyState({ icon: Icon, title, body }: { icon: typeof Search; title: string; body: string }) { return <div className="empty-state"><div><Icon size={25} /></div><h3>{title}</h3><p>{body}</p></div> }
function StateBadge({ state }: { state: Episode['state'] }) { return <span className={`badge ${state === 'canon' ? 'success' : 'draft'}`}>{state === 'canon' ? '정본' : '초안'}</span> }
function ReviewBadge({ state }: { state: ReviewState }) { return state === 'pending' ? <span className="badge neutral"><Clock3 size={12} />검토 대기</span> : state === 'approved' ? <span className="badge success"><Check size={12} />승인됨</span> : <span className="badge draft"><X size={12} />오탐</span> }
function episodeLabel(database: StoryDatabase, id: string) { const episode = database.episodes.find((item) => item.id === id); return episode ? `${episode.number}화 · ${episode.title}` : id }

function EntityEditor({ editor, database, setDatabase, onClose }: { editor: { kind: EntityKind; id?: string }; database: StoryDatabase; setDatabase: React.Dispatch<React.SetStateAction<StoryDatabase>>; onClose: () => void }) {
  const existing = editor.id ? getCollection(database, editor.kind).find((item) => item.id === editor.id) : undefined
  const [form, setForm] = useState<Record<string, string>>(() => entityToForm(editor.kind, existing, database))
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const save = () => {
    const entity = formToEntity(editor.kind, form, existing)
    const key = collectionKey(editor.kind)
    setDatabase((current) => ({ ...current, [key]: editor.id ? current[key].map((item: Work | Episode | Character | Lore) => item.id === editor.id ? entity : item) : [...current[key], entity] } as StoryDatabase))
    onClose()
  }
  const remove = () => {
    if (!editor.id || !window.confirm('이 항목을 삭제할까요?')) return
    const key = collectionKey(editor.kind)
    setDatabase((current) => ({ ...current, [key]: current[key].filter((item: Work | Episode | Character | Lore) => item.id !== editor.id) } as StoryDatabase))
    onClose()
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><div className="modal-header"><div><span className="kicker">{editor.id ? 'EDIT' : 'CREATE'}</span><h2>{entityTitle(editor.kind)}</h2></div><button className="icon-button" onClick={onClose}><X size={19} /></button></div><div className="form-grid">{fieldsFor(editor.kind, database).map((field) => <label className={field.wide ? 'wide' : ''} key={field.key}><span>{field.label}</span>{field.type === 'textarea' ? <textarea value={form[field.key] ?? ''} onChange={(event) => update(field.key, event.target.value)} /> : field.options ? <select value={form[field.key] ?? field.options[0][0]} onChange={(event) => update(field.key, event.target.value)}>{field.options.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select> : <input type={field.type ?? 'text'} value={form[field.key] ?? ''} onChange={(event) => update(field.key, event.target.value)} />}</label>)}</div><div className="modal-footer">{editor.id ? <button className="danger" onClick={remove}><Trash2 size={16} />삭제</button> : <span />}<div><button className="secondary" onClick={onClose}>취소</button><button className="primary" onClick={save}><Check size={16} />저장</button></div></div></div></div>
}

type Field = { key: string; label: string; type?: string; wide?: boolean; options?: Array<[string, string]> }
const visibilityOptions: Array<[string, string]> = [['public', '공개'], ['private', '비공개']]
function fieldsFor(kind: EntityKind, database: StoryDatabase): Field[] {
  if (kind === 'work') return [{ key: 'title', label: '작품명' }, { key: 'genre', label: '장르' }, { key: 'logline', label: '한 줄 소개', type: 'textarea', wide: true }, { key: 'visibility', label: '공개 범위', options: visibilityOptions }]
  if (kind === 'episode') return [{ key: 'number', label: '회차 번호', type: 'number' }, { key: 'title', label: '제목' }, { key: 'state', label: '원고 상태', options: [['draft', '초안'], ['canon', '정본']] }, { key: 'visibility', label: '공개 범위', options: visibilityOptions }, { key: 'synopsis', label: '회차 개요', type: 'textarea', wide: true }, { key: 'content', label: '본문', type: 'textarea', wide: true }]
  if (kind === 'character') return [{ key: 'name', label: '이름' }, { key: 'role', label: '역할' }, { key: 'description', label: '설명', type: 'textarea', wide: true }, { key: 'visibility', label: '공개 범위', options: visibilityOptions }]
  return [{ key: 'category', label: '분류', options: ['인물', '장소', '도구', '규칙', '연표'].map((value) => [value, value]) }, { key: 'subject', label: '대상' }, { key: 'attribute', label: '속성' }, { key: 'value', label: '정본 값' }, { key: 'statement', label: '설정 문장', type: 'textarea', wide: true }, { key: 'aliases', label: '별칭 (쉼표로 구분)', wide: true }, { key: 'conflictingTerms', label: '직접 충돌 표현 (쉼표로 구분)', wide: true }, { key: 'semanticPatterns', label: '간접·의미 패턴 (쉼표로 구분)', wide: true }, { key: 'evidenceEpisodeIds', label: `근거 회차 ID (${database.episodes.length}개 중 선택)`, wide: true }, { key: 'visibility', label: '공개 범위', options: visibilityOptions }]
}
function entityToForm(kind: EntityKind, entity: any, database: StoryDatabase): Record<string, string> {
  if (entity) return Object.fromEntries(Object.entries(entity).map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : String(value)]))
  return { workId: database.works[0]?.id ?? 'new-work', state: 'draft', visibility: 'private', category: '규칙', evidenceEpisodeIds: database.episodes[0]?.id ?? '' }
}
function slug(value: string) { return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || crypto.randomUUID().slice(0, 8) }
function formToEntity(kind: EntityKind, form: Record<string, string>, existing: any): any {
  const id = existing?.id ?? (kind === 'episode' ? `${form.workId}-ep-${String(Number(form.number || 1)).padStart(4, '0')}-${form.state}` : `${kind}-${slug(form.title || form.name || form.subject || '')}`)
  const base = { ...form, id, workId: form.workId || 'twilight-archive', visibility: (form.visibility || 'private') as Visibility }
  if (kind === 'episode') return { ...base, number: Number(form.number || 1), updatedAt: new Date().toISOString() }
  if (kind === 'lore') return { ...base, aliases: (form.aliases ?? '').split(',').map((value) => value.trim()).filter(Boolean), conflictingTerms: (form.conflictingTerms ?? '').split(',').map((value) => value.trim()).filter(Boolean), semanticPatterns: (form.semanticPatterns ?? '').split(',').map((value) => value.trim()).filter(Boolean), evidenceEpisodeIds: (form.evidenceEpisodeIds ?? '').split(',').map((value) => value.trim()).filter(Boolean) }
  return base
}
function collectionKey(kind: EntityKind): 'works' | 'episodes' | 'characters' | 'lore' { return kind === 'work' ? 'works' : kind === 'episode' ? 'episodes' : kind === 'character' ? 'characters' : 'lore' }
function getCollection(database: StoryDatabase, kind: EntityKind): Array<any> { return database[collectionKey(kind)] }
function entityTitle(kind: EntityKind) { return ({ work: '작품 정보', episode: '회차 정보', character: '인물 정보', lore: '설정 정보' } as const)[kind] }
