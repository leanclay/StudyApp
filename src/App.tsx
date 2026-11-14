import { type FormEvent, useMemo, useState } from 'react'

type Screen = 'home' | 'journal' | 'shared' | 'history'
type ReadingWeek = {
  id: number
  title: string
  dates: string
  readings: string[]
  theme: string
}
type Thought = {
  id: number
  author: 'You' | 'Jordan'
  text: string
  refs: string[]
  day: string
}

const weeks: ReadingWeek[] = [
  { id: 44, title: 'A Place to Begin Again', dates: 'Oct 26 – Nov 1', readings: ['Psalms 32–33', 'Psalms 34–35', 'Psalms 36–37'], theme: 'Room for a softer start' },
  { id: 45, title: 'Held Through Every Season', dates: 'Nov 2 – 8', readings: ['Psalms 38–40', 'Psalms 41–43', 'Psalms 44–46'], theme: 'A steady presence beside us' },
  { id: 46, title: 'A Steady Kind of Trust', dates: 'Nov 9 – 15', readings: ['Psalms 47–49', 'Psalms 50–52', 'Psalms 53–55'], theme: 'Learning to lean into grace' },
  { id: 47, title: 'Learning to Listen', dates: 'Nov 16 – 22', readings: ['Psalms 56–58', 'Psalms 59–61', 'Psalms 62–64'], theme: 'Finding quiet in the noise' },
  { id: 48, title: 'Songs for the In-Between', dates: 'Nov 23 – 29', readings: ['Psalms 65–67', 'Psalms 68–69', 'Psalms 70–72'], theme: 'Hope for what comes next' },
]
const initialThoughts: Thought[] = [
  { id: 4, author: 'Jordan', text: 'Today I’m trying to trust that I don’t have to have the whole path figured out. One next step is enough.', refs: ['Psalm 55:22'], day: 'Today' },
  { id: 1, author: 'Jordan', text: 'I keep coming back to the idea that rest is something we’re invited into, not something we have to earn. I needed that reminder today.', refs: ['Psalm 23:1–3'], day: 'Yesterday' },
  { id: 2, author: 'You', text: '“He leads me beside still waters.” A quiet nudge to slow down and notice where I’m already being led.', refs: ['Psalm 23:2', 'Psalm 46:10'], day: 'Yesterday' },
  { id: 3, author: 'Jordan', text: 'This verse feels different after a long week. Maybe being restored starts with letting myself be cared for.', refs: ['Psalm 23:3'], day: 'November 12' },
]
const navItems: { id: Screen; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'journal', label: 'Journal', icon: '✎' },
  { id: 'shared', label: 'Shared', icon: '♡' },
  { id: 'history', label: 'History', icon: '◷' },
]

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [weekIndex, setWeekIndex] = useState(2)
  const [thoughts, setThoughts] = useState(initialThoughts)
  const [entryText, setEntryText] = useState('')
  const [referenceInput, setReferenceInput] = useState('')
  const [references, setReferences] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [selectedDay, setSelectedDay] = useState<'Today' | 'Yesterday' | 'This week'>('Today')
  const [weeklyCompletions, setWeeklyCompletions] = useState<Record<number, { you: boolean; partner: boolean }>>({
    44: { you: true, partner: true },
    45: { you: true, partner: true },
    46: { you: false, partner: true },
    47: { you: false, partner: false },
    48: { you: false, partner: false },
  })
  const [weeklyUnlocks, setWeeklyUnlocks] = useState<Record<number, boolean>>({ 44: true, 45: true })

  const week = weeks[weekIndex]
  const isCurrentWeek = weekIndex === 2
  const weekCompletion = weeklyCompletions[week.id]
  const yourWeekComplete = weekCompletion.you
  const partnerWeekComplete = weekCompletion.partner
  const weeklyUnlocked = Boolean(weeklyUnlocks[week.id])
  const hasTodayEntry = isCurrentWeek && thoughts.some((thought) => thought.author === 'You' && thought.day === 'Today')
  const partnerTodayDone = isCurrentWeek
  const unlocked = hasTodayEntry && partnerTodayDone
  const sharedThoughts = selectedDay === 'This week'
    ? thoughts
    : thoughts.filter((thought) => thought.day === selectedDay)

  const pageTitle = useMemo(() => ({
    home: 'A little space to grow.',
    journal: 'Your journal',
    shared: 'A thought to share.',
    history: 'Look how far you’ve come.',
  }[screen]), [screen])

  function changeWeek(direction: number) {
    setWeekIndex((index) => Math.min(weeks.length - 1, Math.max(0, index + direction)))
    setSelectedDay('Today')
  }

  function toggleWeeklyCompletion() {
    const next = !yourWeekComplete
    setWeeklyCompletions((current) => ({ ...current, [week.id]: { ...current[week.id], you: next } }))
    if (next && partnerWeekComplete) setWeeklyUnlocks((current) => ({ ...current, [week.id]: true }))
  }

  function addReference() {
    const value = referenceInput.trim().replace(/[,.]$/, '')
    if (value && !references.some((ref) => ref.toLowerCase() === value.toLowerCase())) {
      setReferences((current) => [...current, value])
      setReferenceInput('')
    }
  }

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!entryText.trim()) {
      setNotice('Add a thought or a few words before saving.')
      return
    }
    setThoughts((current) => [
      { id: Date.now(), author: 'You', text: entryText.trim(), refs: references, day: isCurrentWeek ? 'Today' : week.dates },
      ...current,
    ])
    setEntryText('')
    setReferences([])
    setReferenceInput('')
    setNotice('Your reflection is saved. Thank you for showing up today.')
    setScreen('home')
  }

  function openJournal() {
    setNotice('')
    setScreen('journal')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setScreen('home')} aria-label="Lumyn home">
          <span className="brand-mark">l<span>✳</span></span>
          <span className="brand-name">lumyn</span>
        </button>
        <div className="topbar-tagline">Read Scripture. Grow Together.</div>
        <div className="profile-button" aria-label="You and Jordan"><span className="avatar you-avatar">Y</span><span className="profile-label">You &amp; Jordan</span></div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-label">YOUR SPACE</div>
          <Navigation screen={screen} setScreen={setScreen} />
          <div className="sidebar-note">
            <span className="note-spark">✳</span>
            <p>Small moments of reflection make room for a deeper connection.</p>
            <span className="note-signature">A little, often.</span>
          </div>
          <div className="sidebar-footer">A shared practice, just for two <span>♡</span></div>
        </aside>

        <main className="main-content">
          <div className="mobile-greeting">
            <span className="eyebrow">{screen === 'home' ? 'SATURDAY, NOVEMBER 14' : 'YOUR SHARED PRACTICE'}</span>
            <h1>{pageTitle}</h1>
          </div>
          {notice && <div className="notice" role="status"><span>✳</span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
          {screen === 'home' && <Home
            week={week}
            weekIndex={weekIndex}
            onChangeWeek={changeWeek}
            onJournal={openJournal}
            onShared={(period) => { setSelectedDay(period); setScreen('shared') }}
            yourDone={hasTodayEntry}
            partnerDone={partnerTodayDone}
            yourWeekComplete={yourWeekComplete}
            partnerWeekComplete={partnerWeekComplete}
            onToggleWeeklyCompletion={toggleWeeklyCompletion}
            weeklyUnlocked={weeklyUnlocked}
            unlocked={unlocked}
            thoughts={thoughts}
            onHistory={() => setScreen('history')}
          />}
          {screen === 'journal' && <Journal
            week={week}
            entryText={entryText}
            setEntryText={setEntryText}
            referenceInput={referenceInput}
            setReferenceInput={setReferenceInput}
            references={references}
            setReferences={setReferences}
            onAddReference={addReference}
            onSave={saveEntry}
            onCancel={() => setScreen('home')}
          />}
          {screen === 'shared' && <Shared
            thoughts={sharedThoughts}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            unlocked={selectedDay === 'Yesterday' || (selectedDay === 'This week' ? weeklyUnlocked : unlocked)}
            yourDone={hasTodayEntry}
            partnerDone={partnerTodayDone}
            yourWeekComplete={yourWeekComplete}
            partnerWeekComplete={partnerWeekComplete}
            onJournal={openJournal}
            onHistory={() => setScreen('history')}
          />}
          {screen === 'history' && <History thoughts={thoughts} weeklyCompletions={weeklyCompletions} onOpenWeek={(index) => { setWeekIndex(index); setScreen('home') }} />}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Main navigation">
        <Navigation screen={screen} setScreen={setScreen} />
      </nav>
    </div>
  )
}

function Navigation({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  return <div className="nav-items">{navItems.map((item) => (
    <button key={item.id} className={`nav-item ${screen === item.id ? 'active' : ''}`} onClick={() => setScreen(item.id)} aria-current={screen === item.id ? 'page' : undefined}>
      <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
    </button>
  ))}</div>
}

function WeekSwitcher({ week, weekIndex, onChangeWeek }: { week: ReadingWeek; weekIndex: number; onChangeWeek: (direction: number) => void }) {
  return <div className="week-switcher">
    <button className="round-control" onClick={() => onChangeWeek(-1)} disabled={weekIndex === 0} aria-label="Previous week">←</button>
    <div className="week-switcher-copy"><span>SAMPLE PLAN <i>·</i> WEEK {week.id}</span><strong>{week.dates}</strong></div>
    <button className="round-control" onClick={() => onChangeWeek(1)} disabled={weekIndex === weeks.length - 1} aria-label="Next week">→</button>
  </div>
}

function Home(props: {
  week: ReadingWeek; weekIndex: number; onChangeWeek: (direction: number) => void; onJournal: () => void; onShared: (period: 'Today' | 'This week') => void;
  yourDone: boolean; partnerDone: boolean; yourWeekComplete: boolean; partnerWeekComplete: boolean; onToggleWeeklyCompletion: () => void; weeklyUnlocked: boolean; unlocked: boolean; thoughts: Thought[]; onHistory: () => void
}) {
  const { week, weekIndex, onChangeWeek, onJournal, onShared, yourDone, partnerDone, yourWeekComplete, partnerWeekComplete, onToggleWeeklyCompletion, weeklyUnlocked, unlocked, thoughts, onHistory } = props
  const ownReflection = thoughts.find((thought) => thought.author === 'You' && thought.day === 'Today')
  return <div className="page-content">
    <section className="week-hero">
      <div className="hero-texture" />
      <div className="hero-top"><span className="hero-kicker">YOUR WEEKLY READING</span><span className="hero-flower">✳</span></div>
      <h2>{week.title}</h2>
      <p className="hero-theme">{week.theme} <span>—</span> together.</p>
      <div className="readings-row">{week.readings.map((reading, index) => <span className="reading-pill" key={reading}><span>{index + 1}</span>{reading}</span>)}</div>
      <WeekSwitcher week={week} weekIndex={weekIndex} onChangeWeek={onChangeWeek} />
    </section>

    <div className="home-grid">
      <section className="panel today-panel">
        <div className="panel-heading"><div><span className="eyebrow">YOUR DAILY MOMENT</span><h3>Today, in a few words</h3></div><span className="date-stamp">NOV 14</span></div>
        <div className="daily-status">
          <PersonStatus name="You" subtitle={yourDone ? 'You showed up today' : 'Your reflection is waiting'} done={yourDone} />
          <div className="status-divider"><span>+</span></div>
          <PersonStatus name="Jordan" subtitle={partnerDone ? 'Jordan has shared today' : 'Still making space'} done={partnerDone} partner />
        </div>
        <div className={`unlock-banner ${unlocked ? 'is-unlocked' : ''}`}>
          <span className="unlock-icon">{unlocked ? '✧' : '⌑'}</span>
          <div><strong>{unlocked ? 'Today’s thoughts are open' : 'Your thoughts unlock together'}</strong><span>{unlocked ? 'A little window into each other’s day.' : 'Once you’ve both reflected, you can read each other’s thoughts.'}</span></div>
          <span className="lock-status">{unlocked ? 'OPEN' : 'LOCKED'}</span>
        </div>
        {ownReflection && <div className="saved-snippet"><span className="saved-label">YOUR REFLECTION</span><p>“{ownReflection.text}”</p></div>}
        <div className="today-actions">
          <button className="button-primary" onClick={onJournal}><span>✎</span>{yourDone ? 'Add another thought' : 'Add your thought'}</button>
          <button className="text-button" onClick={() => onShared('Today')}>View shared thoughts <span>→</span></button>
        </div>
      </section>

      <section className="panel progress-panel">
        <div className="panel-heading"><div><span className="eyebrow">A GENTLE RHYTHM</span><h3>This week, together</h3></div><span className="progress-spark">✳</span></div>
        <p className="panel-description">When you’ve both finished the reading, the week’s thoughts open.</p>
        <div className="weekly-checklist">
          <label className="weekly-person">
            <span className="avatar you-avatar">Y</span>
            <span className="weekly-person-copy"><strong>You</strong><small>{yourWeekComplete ? 'Reading complete' : 'Still reading'}</small></span>
            <input type="checkbox" checked={yourWeekComplete} onChange={onToggleWeeklyCompletion} aria-label="Mark your weekly reading complete" />
          </label>
          <div className="weekly-person">
            <span className="avatar jordan-avatar">J</span>
            <span className="weekly-person-copy"><strong>Jordan</strong><small>{partnerWeekComplete ? 'Reading complete' : 'Still reading'}</small></span>
            <span className={`weekly-check-indicator ${partnerWeekComplete ? 'complete' : ''}`} aria-label={`Jordan's weekly reading ${partnerWeekComplete ? 'complete' : 'not complete'}`}>{partnerWeekComplete ? '✓' : '·'}</span>
          </div>
        </div>
        <div className={`weekly-unlock ${weeklyUnlocked ? 'is-unlocked' : ''}`}>
          <span>{weeklyUnlocked ? '✧' : '⌑'}</span>
          <strong>{weeklyUnlocked ? 'This week’s thoughts are open' : 'This week’s thoughts unlock together'}</strong>
          <button type="button" className="text-button" onClick={() => onShared('This week')}>{weeklyUnlocked ? 'Read thoughts' : 'See what’s needed'} <span>→</span></button>
        </div>
        <button className="text-button history-link" onClick={onHistory}>See your weeks together <span>→</span></button>
      </section>
    </div>
    <section className="invitation-strip">
      <div className="invitation-art"><span>✳</span><i>♡</i></div>
      <div className="invitation-copy"><span className="eyebrow">A SPACE FOR BOTH OF YOU</span><h3>What’s on your heart?</h3><p>Share a question, a hope, or a verse that stayed with you.</p></div>
      <button className="button-outline" onClick={onJournal}>Leave a thought <span>→</span></button>
    </section>
  </div>
}

function PersonStatus({ name, subtitle, done, partner = false }: { name: string; subtitle: string; done: boolean; partner?: boolean }) {
  return <div className="person-status"><span className={`avatar ${partner ? 'jordan-avatar' : 'you-avatar'}`}>{partner ? 'J' : 'Y'}</span><div className="person-copy"><strong>{name}</strong><span>{subtitle}</span></div><span className={`status-check ${done ? 'done' : ''}`}>{done ? '✓' : '·'}</span></div>
}

function Journal(props: {
  week: ReadingWeek; entryText: string; setEntryText: (value: string) => void; referenceInput: string; setReferenceInput: (value: string) => void;
  references: string[]; setReferences: (values: string[]) => void;   onAddReference: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void
}) {
  const { week, entryText, setEntryText, referenceInput, setReferenceInput, references, setReferences, onAddReference, onSave, onCancel } = props
  return <div className="page-content subpage">
    <div className="subpage-intro"><span className="eyebrow">SATURDAY, NOVEMBER 14 <i>·</i> WEEK {week.id}</span><h2>Make room for a thought.</h2><p>No perfect words needed. Just begin where you are.</p></div>
    <form className="journal-form panel" onSubmit={onSave}>
      <label className="field-label" htmlFor="reflection">What’s staying with you?</label>
      <textarea id="reflection" value={entryText} onChange={(event) => setEntryText(event.target.value)} placeholder="A verse, a question, a feeling, a moment…" rows={6} maxLength={1000} autoFocus />
      <div className="form-meta"><span>Your words are just for you until you both share today.</span><span>{entryText.length} / 1,000</span></div>
      <div className="reference-field">
        <label className="field-label" htmlFor="reference">Scripture references <span>OPTIONAL</span></label>
        <div className="reference-input-row"><span className="reference-icon">⌕</span><input id="reference" value={referenceInput} onChange={(event) => setReferenceInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAddReference() } }} placeholder="Add a verse, e.g. Psalm 23:1" /><button type="button" className="add-reference" onClick={onAddReference} disabled={!referenceInput.trim()}>Add</button></div>
        <div className="reference-suggestions">{['Psalm 23:1–3', 'Psalm 46:10', 'Matthew 11:28'].filter((ref) => !references.includes(ref)).map((ref) => <button type="button" key={ref} onClick={() => setReferences([...references, ref])}>+ {ref}</button>)}</div>
        {references.length > 0 && <div className="reference-chips">{references.map((ref) => <span className="reference-chip" key={ref}>{ref}<button type="button" onClick={() => setReferences(references.filter((item) => item !== ref))} aria-label={`Remove ${ref}`}>×</button></span>)}</div>}
      </div>
      <div className="journal-footer"><button type="button" className="text-button" onClick={onCancel}>Cancel</button><button type="submit" className="button-primary" disabled={entryText.length > 1000}>Save reflection <span>→</span></button></div>
    </form>
    <div className="privacy-note"><span>⌑</span><p>Your journal is a gentle space. Daily thoughts open when you’ve both shared; weekly thoughts open when you’ve both finished the reading.</p></div>
  </div>
}

function Shared(props: {
  thoughts: Thought[]; selectedDay: 'Today' | 'Yesterday' | 'This week'; setSelectedDay: (day: 'Today' | 'Yesterday' | 'This week') => void; unlocked: boolean; yourDone: boolean; partnerDone: boolean; yourWeekComplete: boolean; partnerWeekComplete: boolean; onJournal: () => void; onHistory: () => void
}) {
  const { thoughts, selectedDay, setSelectedDay, unlocked, yourDone, partnerDone, yourWeekComplete, partnerWeekComplete, onJournal, onHistory } = props
  const isWeeklyView = selectedDay === 'This week'
  const firstStatus = isWeeklyView ? yourWeekComplete : yourDone
  const secondStatus = isWeeklyView ? partnerWeekComplete : partnerDone
  const gateName = isWeeklyView ? 'weekly reading' : 'a thought today'
  return <div className="page-content subpage">
    <div className="subpage-intro"><span className="eyebrow">A SHARED SPACE <i>·</i> NOVEMBER 14</span><h2>Thoughts, held together.</h2><p>One small window into each other’s inner world.</p></div>
    <div className="day-tabs" aria-label="Choose a day or week">
      {(['Today', 'Yesterday', 'This week'] as const).map((period) => <button key={period} aria-pressed={selectedDay === period} className={selectedDay === period ? 'selected' : ''} onClick={() => setSelectedDay(period)}>{period}<span>{period === 'Yesterday' || (selectedDay === period && unlocked) ? 'OPEN' : '⌑'}</span></button>)}
    </div>
    {unlocked ? <div className="thought-list">
      {thoughts.length ? thoughts.map((thought) => <article className={`thought-card ${thought.author === 'You' ? 'own-thought' : ''}`} key={thought.id}>
        <div className="thought-header"><span className={`avatar small-avatar ${thought.author === 'You' ? 'you-avatar' : 'jordan-avatar'}`}>{thought.author === 'You' ? 'Y' : 'J'}</span><strong>{thought.author === 'You' ? 'You' : 'Jordan'}</strong><span className="thought-time">{thought.day === 'Today' ? 'TODAY' : thought.day.toUpperCase()}</span></div>
        <p className="thought-text">{thought.text}</p>
        {thought.refs.length > 0 && <div className="thought-refs">{thought.refs.map((ref) => <span key={ref}>♡ &nbsp;{ref}</span>)}</div>}
      </article>) : <div className="empty-thoughts"><span>✳</span><h3>A quiet day, and that’s okay.</h3><p>No thoughts from this day yet. You can always add one when you’re ready.</p></div>}
      <div className="shared-footer"><span>Held with care, by both of you <b>♡</b></span><button className="text-button" onClick={onHistory}>Visit your history <span>→</span></button></div>
    </div> : <div className="locked-card panel">
      <div className="lock-illustration"><span className="lock-orbit orbit-one" /><span className="lock-orbit orbit-two" /><span className="lock-symbol">⌑</span><span className="lock-flower">✳</span></div>
      <span className="eyebrow">A MOMENT HELD FOR BOTH OF YOU</span><h3>Almost there, together.</h3><p>This space opens once you’ve both completed {gateName}. There’s no rush — the moment will be here when you’re ready.</p>
      <div className="unlock-checklist"><div><span className={firstStatus ? 'complete' : ''}>{firstStatus ? '✓' : '·'}</span><span>{isWeeklyView ? 'You finished the reading' : 'You’ve shared today'}</span><b>{firstStatus ? 'DONE' : 'WAITING'}</b></div><div><span className={secondStatus ? 'complete' : ''}>{secondStatus ? '✓' : '·'}</span><span>{isWeeklyView ? 'Jordan finished the reading' : 'Jordan has shared today'}</span><b>{secondStatus ? 'DONE' : 'WAITING'}</b></div></div>
      {!isWeeklyView && !yourDone && <button className="button-primary" onClick={onJournal}>Add your thought <span>→</span></button>}
      {selectedDay !== 'Yesterday' && <button className="text-button" onClick={() => setSelectedDay('Yesterday')}>Read thoughts from yesterday <span>→</span></button>}
    </div>}
  </div>
}

function History({ thoughts, weeklyCompletions, onOpenWeek }: { thoughts: Thought[]; weeklyCompletions: Record<number, { you: boolean; partner: boolean }>; onOpenWeek: (index: number) => void }) {
  const entries = thoughts.length
  return <div className="page-content subpage">
    <div className="subpage-intro"><span className="eyebrow">YOUR STORY SO FAR</span><h2>Look how far you’ve come.</h2><p>Each little moment adds up to something meaningful.</p></div>
    <section className="history-summary panel"><div className="history-summary-icon">✳</div><div><span className="eyebrow">A PRACTICE IN PROGRESS</span><h3>Growing side by side</h3><p>{entries} reflections in your journals. Every one counts.</p></div><div className="history-total"><strong>{entries}</strong><span>thoughts</span></div></section>
    <div className="history-section-heading"><div><span className="eyebrow">COME, FOLLOW ME</span><h3>Your weeks together</h3></div><span className="history-years">2026</span></div>
    <div className="history-list">{weeks.slice().reverse().map((week, reverseIndex) => {
      const index = weeks.length - 1 - reverseIndex
      const completion = weeklyCompletions[week.id]
      return <button className={`history-week ${index === 2 ? 'current-history' : ''}`} key={week.id} onClick={() => onOpenWeek(index)}>
        <div className="history-week-date"><span>{week.dates.split(' – ')[0]}</span><i>{week.dates.split(' – ')[1]}</i></div>
        <div className="history-week-copy"><span className="history-week-kicker">WEEK {week.id} {index === 2 && <b>THIS WEEK</b>}</span><strong>{week.title}</strong><span>{week.readings.join(' · ')}</span></div>
        <div className="history-week-counts"><div aria-label={`You ${completion.you ? 'complete' : 'not complete'}, Jordan ${completion.partner ? 'complete' : 'not complete'}`}><span className="mini-dot you-dot" />Y {completion.you ? '✓' : '·'} <span className="mini-dot jordan-dot" />J {completion.partner ? '✓' : '·'}</div><span>{index < 2 ? 'PAST WEEK' : index === 2 ? 'THIS WEEK' : 'UP NEXT'}</span></div>
        <span className="history-arrow">→</span>
      </button>
    })}</div>
    <div className="history-footer">Your story is still unfolding. <span>♡</span></div>
  </div>
}

export default App
