import { useState, useEffect } from 'react'
import './App.css'

const BADGE_CLASS = {
  'likely human': 'badge-human',
  'uncertain': 'badge-uncertain',
  'likely AI': 'badge-ai',
}

const RESULT_MESSAGE = {
  'likely human': (pct) =>
    `The text does not showcase strong evidence for the text to be AI generated. The text received a score for being ${pct}% likely to be AI-generated.`,
  'uncertain': (pct) =>
    `The system is unsure if the provided text is AI generated or not. The text received a score for being ${pct}% likely to be AI-generated.`,
  'likely AI': (pct) =>
    `Based on the patterns commonly shown with AI-generated content, the text does showcase strong evidence for the text to be AI generated. The text received a score for being ${pct}% likely to be AI generated.`,
}

function resultMessage(attribution, score) {
  const pct = Math.round(score * 100)
  return RESULT_MESSAGE[attribution]?.(pct) ?? ''
}

function ScoreBar({ score }) {
  const pct = Math.round(score * 100)
  const color = score < 0.36 ? '#22c55e' : score < 0.71 ? '#f59e0b' : '#ef4444'
  return (
    <div className="score-bar">
      <div className="score-bar__track">
        <div className="score-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="score-bar__pct" style={{ color }}>{pct}%</span>
    </div>
  )
}

function AnalyzeForm({ onResult }) {
  const [text, setText] = useState('')
  const [contentId, setContentId] = useState('')
  const [creatorId, setCreatorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, content_id: contentId, creator_id: creatorId }),
      })
      if (!res.ok) throw new Error(`Server responded with ${res.status}`)
      const data = await res.json()
      onResult({ ...data, text })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="analyze-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <div className="field">
          <label htmlFor="content-id">Content ID</label>
          <input
            id="content-id"
            type="text"
            value={contentId}
            onChange={e => setContentId(e.target.value)}
            placeholder="doc-001"
          />
        </div>
        <div className="field">
          <label htmlFor="creator-id">Creator ID</label>
          <input
            id="creator-id"
            type="text"
            value={creatorId}
            onChange={e => setCreatorId(e.target.value)}
            placeholder="user-42"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="text-input">Text to analyze</label>
        <textarea
          id="text-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste the text you want to analyze for AI provenance…"
          rows={7}
          required
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? <><span className="spinner" /> Analyzing…</> : 'Analyze Text →'}
      </button>
    </form>
  )
}

function ResultCard({ result }) {
  if (!result) return null
  const badgeClass = BADGE_CLASS[result.attribution] ?? ''
  return (
    <div className="result-card">
      <div className="result-card__top">
        <div className="result-card__left">
          <p className="result-card__eyebrow">Latest result</p>
          <span className={`badge badge--lg ${badgeClass}`}>{result.attribution}</span>
          <ScoreBar score={result.score} />
          <div className="result-card__meta">
            <span>Score <strong>{result.score}</strong></span>
            <span>Status <strong>{result.status}</strong></span>
          </div>
        </div>
        <p className="result-card__message">{resultMessage(result.attribution, result.score)}</p>
      </div>
      {result.text && (
        <div className="result-card__text">
          <span className="result-card__text-label">Analyzed text</span>
          <p>{result.text}</p>
        </div>
      )}
    </div>
  )
}

const TRUNCATE_LEN = 240

function HistoryEntry({ entry }) {
  const [expanded, setExpanded] = useState(false)
  const text = entry.text ?? ''
  const isLong = text.length > TRUNCATE_LEN
  const displayed = expanded || !isLong ? text : text.slice(0, TRUNCATE_LEN)

  return (
    <div className="history-entry">
      <div className="history-entry__header">
        <span className={`badge ${BADGE_CLASS[entry.attribution] ?? ''}`}>
          {entry.attribution}
        </span>
        <div className="history-entry__score">
          <ScoreBar score={entry.confidence} />
        </div>
        <span className="history-entry__ts">
          {new Date(entry.timestamp).toLocaleString()}
        </span>
      </div>

      <div className="history-entry__ids">
        <span className="id-chip">
          <span className="id-chip__label">content</span>
          <code>{entry.content_id}</code>
        </span>
        <span className="id-chip">
          <span className="id-chip__label">creator</span>
          <code>{entry.creator_id}</code>
        </span>
        <span className="id-chip">
          <span className="id-chip__label">status</span>
          <code>{entry.status}</code>
        </span>
      </div>

      <p className="history-entry__message">
        {resultMessage(entry.attribution, entry.confidence)}
      </p>

      {text ? (
        <div className="history-entry__text">
          <p>{displayed}{!expanded && isLong ? '…' : ''}</p>
          {isLong && (
            <button
              className="expand-btn"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? 'Show less ↑' : 'Show more ↓'}
            </button>
          )}
        </div>
      ) : (
        <p className="history-entry__no-text">No text stored</p>
      )}
    </div>
  )
}

function HistoryList({ entries, loading }) {
  if (loading && !entries.length) return <p className="empty-state">Loading…</p>
  if (!entries.length) return (
    <p className="empty-state">No entries yet — analyze some text to get started!</p>
  )
  return (
    <div className="history-list">
      {entries.map((entry, i) => (
        <HistoryEntry key={i} entry={entry} />
      ))}
    </div>
  )
}

export default function App() {
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  async function fetchHistory() {
    setHistoryLoading(true)
    try {
      const res = await fetch('/log?limit=100')
      const data = await res.json()
      setHistory(data)
    } catch (err) {
      console.error('Failed to fetch history', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  function handleResult(data) {
    setResult(data)
    fetchHistory()
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-header__icon" aria-hidden="true">🔍</span>
        <h1 className="app-header__title">Provenance Guard</h1>
        <p className="app-header__tagline">
          Drop in any text and find out if it was written by a human or generated by AI.
        </p>
      </header>

      <main className="app-main">
        <section className="card">
          <h2 className="section-title">Analyze Text</h2>
          <AnalyzeForm onResult={handleResult} />
          {result && <ResultCard result={result} />}
        </section>

        <section className="card">
          <div className="section-header-row">
            <h2 className="section-title">Audit History</h2>
            <button
              className="refresh-btn"
              onClick={fetchHistory}
              disabled={historyLoading}
            >
              {historyLoading ? 'Loading…' : '↻ Refresh'}
            </button>
          </div>
          <HistoryList entries={history} loading={historyLoading} />
        </section>
      </main>

      <footer className="app-footer">
        Provenance Guard — scored by perplexity &amp; burstiness
      </footer>
    </div>
  )
}
