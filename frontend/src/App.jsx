import { useState, useEffect, useCallback } from 'react'
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

const PRESETS = [
  {
    label: 'Likely AI',
    text: `Artificial intelligence represents a transformative paradigm shift in modern society. It is important to note that while the benefits of AI are numerous, it is equally essential to consider the ethical implications. Furthermore, stakeholders across various sectors must collaborate to ensure responsible deployment.`,
  },
  {
    label: 'Likely human',
    text: `ok so i finally tried that new ramen place downtown and honestly? underwhelming. the broth was fine but they put WAY too much sodium in it and i was thirsty for like three hours after. my friend got the spicy version and said it was better. probably won't go back unless someone drags me there`,
  },
  {
    label: 'Borderline — formal',
    text: `The relationship between monetary policy and asset price inflation has been extensively studied in the literature. Central banks face a fundamental tension between their mandate for price stability and the unintended consequences of prolonged low interest rates on equity and real estate valuations.`,
  },
  {
    label: 'Borderline — edited AI',
    text: `I've been thinking a lot about remote work lately. There are genuine tradeoffs — flexibility and no commute on one side, isolation and blurred work-life boundaries on the other. Studies show productivity varies widely by individual and role type.`,
  },
]

function AnalyzeForm({ onResult }) {
  const [text, setText] = useState('')
  const [contentId, setContentId] = useState('')
  const [creatorId, setCreatorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!contentId.trim()) { setError('Content ID is required.'); return }
    if (!creatorId.trim()) { setError('Creator ID is required.'); return }
    setLoading(true)
    try {
      const res = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, content_id: contentId, creator_id: creatorId }),
      })
      const raw = await res.text()
      let data = {}
      try { data = raw ? JSON.parse(raw) : {} } catch (_) {}
      if (res.status === 409) throw new Error(`Content ID "${contentId}" already exists in the database.`)
      if (!res.ok) throw new Error(data.error || `Server responded with ${res.status}`)
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
      <div className="presets">
        <div style={{display:"block"}}>
        <h5 className="presets__label" style={{marginBottom:"1rem"}}>Try an example:</h5>
        {PRESETS.map((p) => (
          <div key={p.label} className="preset-wrap">
            <button
              type="button"
              className="preset-btn"
              onClick={() => setText(p.text)}
            >
              {p.text.slice(0, 52)}…
            </button>
            <div className="preset-tooltip">{p.text}</div>
          </div>
        ))}
        </div>
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

function HistoryEntry({ entry, onAppeal }) {
  const [expanded, setExpanded] = useState(false)
  const [appealing, setAppealing] = useState(false)
  const [reasoning, setReasoning] = useState('')
  const [appealLoading, setAppealLoading] = useState(false)
  const [appealError, setAppealError] = useState(null)

  const text = entry.text ?? ''
  const isLong = text.length > TRUNCATE_LEN
  const displayed = expanded || !isLong ? text : text.slice(0, TRUNCATE_LEN)
  const isUnderReview = entry.status === 'under_review'

  async function handleAppeal(e) {
    e.preventDefault()
    setAppealError(null)
    setAppealLoading(true)
    try {
      const res = await fetch('/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: entry.content_id, creator_reasoning: reasoning }),
      })
      const raw = await res.text()
      let data = {}
      try { data = raw ? JSON.parse(raw) : {} } catch (_) {}
      if (!res.ok) throw new Error(data.error || `Server responded with ${res.status}`)
      setAppealing(false)
      setReasoning('')
      onAppeal()
    } catch (err) {
      setAppealError(err.message)
    } finally {
      setAppealLoading(false)
    }
  }

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
        {isUnderReview ? (
          <span className="appeal-status-chip">⏳ Under review</span>
        ) : (
          <button className="appeal-btn" onClick={() => setAppealing(v => !v)}>
            {appealing ? 'Cancel' : 'Appeal'}
          </button>
        )}
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
            <button className="expand-btn" onClick={() => setExpanded(v => !v)}>
              {expanded ? 'Show less ↑' : 'Show more ↓'}
            </button>
          )}
        </div>
      ) : (
        <p className="history-entry__no-text">No text stored</p>
      )}

      {appealing && (
        <form className="appeal-form" onSubmit={handleAppeal}>
          <label className="appeal-form__label" htmlFor={`reasoning-${entry.content_id}`}>
            Explain why you're appealing this decision
          </label>
          <textarea
            id={`reasoning-${entry.content_id}`}
            className="appeal-form__textarea"
            value={reasoning}
            onChange={e => setReasoning(e.target.value)}
            placeholder="Describe why you believe this classification is incorrect…"
            rows={3}
            required
          />
          {appealError && <p className="appeal-form__error">{appealError}</p>}
          <div className="appeal-form__actions">
            <button type="submit" className="appeal-submit-btn" disabled={appealLoading}>
              {appealLoading ? <><span className="spinner" /> Submitting…</> : 'Submit Appeal'}
            </button>
            <button
              type="button"
              className="appeal-cancel-btn"
              onClick={() => { setAppealing(false); setAppealError(null); setReasoning('') }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const LABELS = ['likely human', 'uncertain', 'likely AI']
const LABEL_COLOR = { 'likely human': '#22c55e', 'uncertain': '#f59e0b', 'likely AI': '#ef4444' }

function AnalyticsModal({ onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal analytics-modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Analytics</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : !data ? (
          <p className="empty-state">Failed to load analytics.</p>
        ) : (
          <div className="analytics-body">

            <section className="analytics-section">
              <h3 className="analytics-section__title">Verdict Distribution</h3>
              <p className="analytics-section__sub">{data.total} total submission{data.total !== 1 ? 's' : ''}</p>
              <div className="verdict-bars">
                {LABELS.map(label => {
                  const info = data.distribution[label] || { count: 0, pct: 0 }
                  return (
                    <div key={label} className="verdict-bar-row">
                      <span className={`badge ${BADGE_CLASS[label]} verdict-bar-badge`}>{label}</span>
                      <div className="verdict-bar__track">
                        <div
                          className="verdict-bar__fill"
                          style={{ width: `${info.pct}%`, background: LABEL_COLOR[label] }}
                        />
                      </div>
                      <span className="verdict-bar__stat">
                        {info.count} <span className="verdict-bar__pct">({info.pct}%)</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="analytics-section">
              <h3 className="analytics-section__title">Appeal Rate by Label</h3>
              <div className="appeal-rate-grid">
                {LABELS.map(label => {
                  const info = data.appeal_rate[label] || { total: 0, appealed: 0, rate: 0 }
                  return (
                    <div key={label} className="appeal-rate-card">
                      <span className={`badge ${BADGE_CLASS[label]}`}>{label}</span>
                      <div className="appeal-rate-card__num">{info.appealed} / {info.total}</div>
                      <div className="appeal-rate-card__label">appealed</div>
                      <div className="appeal-rate-card__rate" style={{ color: LABEL_COLOR[label] }}>
                        {info.rate}% rate
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="analytics-section">
              <h3 className="analytics-section__title">Top Submitters by Label</h3>
              <div className="top-users-grid">
                {LABELS.map(label => {
                  const users = data.top_users[label] || []
                  return (
                    <div key={label} className="top-users-col">
                      <div className="top-users-col__header">
                        <span className={`badge ${BADGE_CLASS[label]}`}>{label}</span>
                      </div>
                      {users.length === 0 ? (
                        <p className="top-users-empty">No submissions</p>
                      ) : (
                        <ol className="top-users-list">
                          {users.map((u, i) => (
                            <li key={u.creator_id} className="top-users-item">
                              <span className="top-users-rank">#{i + 1}</span>
                              <code className="top-users-id">{u.creator_id}</code>
                              <span className="top-users-count" style={{ color: LABEL_COLOR[label] }}>
                                {u.count}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  )
}

function AppealsModal({ onClose }) {
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/appeals')
      .then(r => r.json())
      .then(data => { setAppeals(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Appeals</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : !appeals.length ? (
          <p className="empty-state">No appeals have been filed yet.</p>
        ) : (
          <div className="appeals-list">
            {appeals.map((a, i) => (
              <div key={i} className="appeal-item">
                <div className="appeal-item__header">
                  <span className={`badge ${BADGE_CLASS[a.attribution] ?? ''}`}>{a.attribution}</span>
                  <span className="appeal-item__ts">{new Date(a.timestamp).toLocaleString()}</span>
                </div>
                <div className="appeal-item__ids">
                  <span className="id-chip">
                    <span className="id-chip__label">content</span>
                    <code>{a.content_id}</code>
                  </span>
                  <span className="id-chip">
                    <span className="id-chip__label">creator</span>
                    <code>{a.creator_id}</code>
                  </span>
                  <span className="id-chip">
                    <span className="id-chip__label">confidence</span>
                    <code>{Math.round(a.confidence * 100)}%</code>
                  </span>
                </div>
                {a.text && (
                  <div className="appeal-item__text">
                    <span className="appeal-item__text-label">Submitted text</span>
                    <p>{a.text}</p>
                  </div>
                )}
                <div className="appeal-item__reasoning">
                  <span className="appeal-item__reasoning-label">Creator reasoning</span>
                  <p>{a.creator_reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryList({ entries, loading, onAppeal }) {
  if (loading && !entries.length) return <p className="empty-state">Loading…</p>
  if (!entries.length) return (
    <p className="empty-state">No entries yet — analyze some text to get started!</p>
  )
  return (
    <div className="history-list">
      {entries.map((entry, i) => (
        <HistoryEntry key={i} entry={entry} onAppeal={onAppeal} />
      ))}
    </div>
  )
}

export default function App() {
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [showAppeals, setShowAppeals] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/log?limit=100')
      const data = await res.json()
      setHistory(data)
    } catch (err) {
      console.error('Failed to fetch history', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // eslint-disable-next-line
  useEffect(() => { fetchHistory() }, [fetchHistory])

  function handleResult(data) {
    setResult(data)
    setHistoryLoading(true)
    fetchHistory()
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="analytics-nav-btn" onClick={() => setShowAnalytics(true)}>
          Analytics
        </button>
        <button className="appeals-nav-btn" onClick={() => setShowAppeals(true)}>
          Appeals
        </button>
        <span className="app-header__icon" aria-hidden="true">🔍</span>
        <h1 className="app-header__title">Provenance Guard</h1>
        <p className="app-header__tagline">
          Drop in any text and find out if it was written by a human or generated by AI.
        </p>
      </header>
      {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} />}
      {showAppeals && <AppealsModal onClose={() => setShowAppeals(false)} />}

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
          <HistoryList entries={history} loading={historyLoading} onAppeal={fetchHistory} />
        </section>
      </main>

      <footer className="app-footer">
        Provenance Guard — scored by perplexity &amp; burstiness
      </footer>
    </div>
  )
}
