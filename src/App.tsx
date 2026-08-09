import { useMemo, useState } from 'react'
import {
  Activity, Archive, BookOpen, Bot, Check, ChevronRight, CircleAlert, Clock3,
  Database, FileCheck2, FileText, Gauge, GitBranch, LayoutDashboard, Menu,
  Plus, RefreshCcw, Search, Settings2, ShieldCheck, Sparkles, Trash2, Users, X,
} from 'lucide-react'
import { benchmarkCases } from './data/seed'
import { useDatabase } from './hooks/useDatabase'
import { inspectContinuity, runEvaluation, searchLore } from './lib/continuity'
import type { Character, Database as StoryDatabase, Episode, Lore, ReviewState, Visibility, Work } from './types'

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
  continuity: { eyebrow: 'CONTINUITY', title: 'AI 연속성 워크벤치', description: '새 원고에서 관련 설정을 찾고 검토 가능한 충돌 후보를 만듭니다.' },
  evaluation: { eyebrow: 'EVALUATION', title: '품질 평가', description: '의도적 충돌과 정상 문장으로 검색·판정 품질을 회귀 테스트합니다.' },
}

export default function App() {
  const { database, setDatabase, reset } = useDatabase()
  const [view, setView] = useState<View>('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [editor, setEditor] = useState<{ kind: EntityKind; id?: string } | null>(null)
  const page = labels[view]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><GitBranch size={20} /></div><div><strong>StoryOps</strong><span>Continuity studio</span></div></div>
        <nav>
          <p className="nav-label">WORKSPACE</p>
          {navItems.map((item) => <button className={view === item.id ? 'active' : ''} onClick={() => { setView(item.id); setMobileNav(false) }} key={item.id}><item.icon size={18} /><span>{item.label}</span>{view === item.id && <ChevronRight size={16} />}</button>)}
        </nav>
        <div className="privacy-card"><ShieldCheck size={20} /><div><strong>원고 보호됨</strong><span>원문은 로컬 전용 저장소에서만 처리됩니다.</span></div></div>
        <div className="sidebar-footer"><span className="status-dot" />공개 데모 · 합성 데이터</div>
      </aside>

      <main>
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="메뉴"><Menu size={20} /></button>
          <div className="breadcrumb"><span>황혼의 기록관</span><ChevronRight size={14} /><strong>{page.title}</strong></div>
          <div className="top-actions"><span className="sync-state"><span className="status-dot" />모든 변경 저장됨</span><button className="avatar" title="데모 사용자">SO</button></div>
        </header>

        <div className="page-wrap">
          <div className="page-heading"><div><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.description}</p></div>{view !== 'continuity' && view !== 'evaluation' && <button className="secondary" onClick={reset}><RefreshCcw size={16} />데모 초기화</button>}</div>
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
  return <>
    <section className="stats-grid">
      <StatCard icon={FileText} tone="sand" label="전체 회차" value={database.episodes.length} meta={`${canon} 정본 · ${draft} 초안`} />
      <StatCard icon={Database} tone="sage" label="등록 설정" value={database.lore.length} meta={`${database.characters.length}명 인물 연결`} />
      <StatCard icon={CircleAlert} tone="coral" label="검토 기록" value={reviewCount} meta={reviewCount ? '사용자 판단 반영됨' : '새 원고를 검사해 보세요'} />
      <StatCard icon={Activity} tone="blue" label="평가 정확도" value="100%" meta="합성 회귀셋 10건" />
    </section>
    <section className="overview-grid">
      <div className="panel progress-panel">
        <div className="panel-heading"><div><span className="kicker">PIPELINE</span><h2>원고 처리 흐름</h2></div><span className="badge success"><Check size={13} />정상</span></div>
        <div className="pipeline">
          {[
            ['01', '백업과 분류', '원본 보존 · 공개 분리', true],
            ['02', '회차별 정리', '안정 ID · 상태 관리', true],
            ['03', '설정 검색', '근거 회차 연결', true],
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
    <section className="panel decision-panel"><div className="decision-icon"><Bot size={24} /></div><div><span className="kicker">WHY STORYOPS</span><h2>AI가 판정하고, 작가가 결정합니다.</h2><p>오류 후보에는 항상 설정 원문과 근거 회차가 따라옵니다. 승인과 오탐 판정은 저장되어 다음 검수의 맥락이 됩니다.</p></div><button className="secondary" onClick={() => onNavigate('evaluation')}>평가 리포트 <ChevronRight size={16} /></button></section>
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
  const setReview = (id: string, state: ReviewState) => setDatabase((current) => ({ ...current, reviews: { ...current.reviews, [id]: state } }))
  return <div className="continuity-grid">
    <section className="panel manuscript-panel"><div className="panel-heading"><div><span className="kicker">MANUSCRIPT</span><h2>검사할 원고</h2></div><span className="badge neutral">브라우저 내 처리</span></div>
      <textarea value={text} onChange={(event) => { setText(event.target.value); setHasRun(false) }} aria-label="검사할 원고" />
      <div className="editor-meta"><span>{text.length.toLocaleString()}자</span><span>{chunks}개 문단</span><span>설정 {database.lore.length}개 검색</span></div>
      <button className="primary full" onClick={() => setHasRun(true)}><Sparkles size={18} />연속성 검사 실행</button>
      <div className="process-note"><Bot size={20} /><div><strong>설명 가능한 검사</strong><span>문장 분할 → 관련 설정 검색 → 충돌 후보 생성 → 사용자 검수</span></div></div>
    </section>
    <section className="panel results-panel"><div className="panel-heading"><div><span className="kicker">REVIEW QUEUE</span><h2>검사 결과</h2></div>{hasRun && <span className={`badge ${issues.length ? 'warning' : 'success'}`}>{issues.length ? `${issues.length}건 발견` : '충돌 없음'}</span>}</div>
      {!hasRun ? <EmptyState icon={Search} title="아직 검사하지 않았습니다" body="왼쪽 원고를 확인하고 연속성 검사를 실행하세요." /> : issues.length === 0 ? <EmptyState icon={Check} title="충돌 후보가 없습니다" body="현재 설정 기준으로 일관된 원고입니다." /> : <div className="issue-list">{issues.map((issue) => <article className={`issue-card ${issue.status}`} key={issue.id}><div className="issue-header"><span className={`severity ${issue.severity}`}>{issue.severity === 'high' ? '높음' : issue.severity === 'medium' ? '보통' : '낮음'}</span><span>신뢰도 {Math.round(issue.score * 100)}%</span><ReviewBadge state={issue.status} /></div><blockquote>{issue.sentence}</blockquote><p>{issue.explanation}</p><div className="evidence-box"><span><FileCheck2 size={15} />정본 근거</span><strong>{issue.evidence.statement}</strong><code>{issue.evidence.evidenceEpisodeIds.map((id) => episodeLabel(database, id)).join(', ')}</code></div><div className="review-actions"><button className={issue.status === 'approved' ? 'selected' : ''} onClick={() => setReview(issue.id, 'approved')}><Check size={15} />오류 승인</button><button className={issue.status === 'false_positive' ? 'selected' : ''} onClick={() => setReview(issue.id, 'false_positive')}><X size={15} />오탐 처리</button></div></article>)}</div>}
    </section>
  </div>
}

function EvaluationView({ database }: { database: StoryDatabase }) {
  const [runAt, setRunAt] = useState(0)
  const result = useMemo(() => runEvaluation(benchmarkCases, database.lore), [database.lore, runAt])
  return <div className="content-stack">
    <section className="evaluation-hero"><div><span className="eyebrow">REGRESSION SUITE</span><h2>검사 품질을 숫자로 확인합니다.</h2><p>충돌 5건과 정상 5건을 동일한 검색·판정 파이프라인에 통과시켰습니다.</p></div><button className="primary" onClick={() => setRunAt(Date.now())}><RefreshCcw size={17} />평가 다시 실행</button></section>
    <section className="metrics-grid"><Metric label="정확도" value={`${Math.round(result.accuracy * 100)}%`} note={`${result.total}개 평가 문장`} /><Metric label="재현율" value={`${Math.round(result.recall * 100)}%`} note={`누락 ${result.falseNegative}건`} /><Metric label="검색 Hit@5" value={`${Math.round(result.retrievalHitRate * 100)}%`} note={`MRR ${result.meanReciprocalRank.toFixed(2)}`} /><Metric label="실행 시간" value={`${result.latencyMs.toFixed(2)}ms`} note={`추정 비용 $${result.estimatedCostUsd.toFixed(4)}`} /></section>
    <section className="evaluation-grid"><div className="panel"><div className="panel-heading"><div><span className="kicker">TEST CASES</span><h2>문장별 결과</h2></div><span className="badge success"><Check size={13} />{result.truePositive + result.trueNegative}/{result.total} 통과</span></div><div className="eval-list">{result.rows.map((row) => { const pass = row.detected === row.expectedConflict; return <div className="eval-row" key={row.id}><span className={`eval-status ${pass ? 'pass' : 'fail'}`}>{pass ? <Check size={14} /> : <X size={14} />}</span><div><strong>{row.label}</strong><p>{row.sentence}</p></div><span className={`badge ${row.expectedConflict ? 'warning' : 'neutral'}`}>{row.expectedConflict ? '의도 충돌' : '정상'}</span><span className="rank">{row.retrievedRank ? `검색 #${row.retrievedRank}` : '—'}</span></div>})}</div></div>
      <div className="panel failure-panel"><div className="panel-heading"><div><span className="kicker">FAILURE ANALYSIS</span><h2>실패 유형</h2></div></div>{result.falsePositive + result.falseNegative === 0 ? <div className="perfect-state"><div><ShieldCheck size={30} /></div><h3>현재 회귀셋 통과</h3><p>등록된 표현 범위에서는 오탐과 누락이 없습니다. 실제 원고에서는 아래 위험을 계속 추적합니다.</p></div> : null}<div className="risk-list"><div><span>01</span><p><strong>간접 표현</strong>동의어나 비유가 충돌 사전에 없으면 누락될 수 있습니다.</p></div><div><span>02</span><p><strong>시간축 변화</strong>설정 변경 시점이 명시되지 않으면 정상 변화를 오류로 볼 수 있습니다.</p></div><div><span>03</span><p><strong>화자 신뢰성</strong>인물의 거짓말이나 추측은 문맥 없이는 판별하기 어렵습니다.</p></div></div></div>
    </section>
  </div>
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><p>{note}</p></div> }
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
  return [{ key: 'category', label: '분류', options: ['인물', '장소', '도구', '규칙', '연표'].map((value) => [value, value]) }, { key: 'subject', label: '대상' }, { key: 'attribute', label: '속성' }, { key: 'value', label: '정본 값' }, { key: 'statement', label: '설정 문장', type: 'textarea', wide: true }, { key: 'conflictingTerms', label: '충돌 표현 (쉼표로 구분)', wide: true }, { key: 'evidenceEpisodeIds', label: `근거 회차 ID (${database.episodes.length}개 중 선택)`, wide: true }, { key: 'visibility', label: '공개 범위', options: visibilityOptions }]
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
  if (kind === 'lore') return { ...base, conflictingTerms: form.conflictingTerms.split(',').map((value) => value.trim()).filter(Boolean), evidenceEpisodeIds: form.evidenceEpisodeIds.split(',').map((value) => value.trim()).filter(Boolean) }
  return base
}
function collectionKey(kind: EntityKind): 'works' | 'episodes' | 'characters' | 'lore' { return kind === 'work' ? 'works' : kind === 'episode' ? 'episodes' : kind === 'character' ? 'characters' : 'lore' }
function getCollection(database: StoryDatabase, kind: EntityKind): Array<any> { return database[collectionKey(kind)] }
function entityTitle(kind: EntityKind) { return ({ work: '작품 정보', episode: '회차 정보', character: '인물 정보', lore: '설정 정보' } as const)[kind] }
