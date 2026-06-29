'use client'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

type AgentStatus = 'idle' | 'running' | 'done'
interface AgentState { data: AgentStatus; news: AgentStatus; quant: AgentStatus; writer: AgentStatus }
interface AgentMessage { data: string; news: string; quant: string; writer: string }

const AGENTS = [
  { key: 'data', label: 'Data Agent', desc: 'Market data via yfinance', icon: '◉' },
  { key: 'news', label: 'News Sentiment', desc: 'Headlines via Tavily', icon: '◉' },
  { key: 'quant', label: 'Quant Engine', desc: 'Valuation & risk scoring', icon: '◉' },
  { key: 'writer', label: 'Report Writer', desc: 'Structured analysis via Claude', icon: '◉' },
]

const SAMPLE_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'JPM', 'GS', 'NFLX']

const TICKER_TAPE = [
  { t: 'AAPL', p: '291.58', d: '+1.2%', up: true },
  { t: 'NVDA', p: '200.42', d: '+3.8%', up: true },
  { t: 'TSLA', p: '280.14', d: '-0.9%', up: false },
  { t: 'MSFT', p: '415.32', d: '+0.6%', up: true },
  { t: 'GOOGL', p: '178.94', d: '+1.1%', up: true },
  { t: 'META', p: '612.45', d: '+2.3%', up: true },
  { t: 'AMZN', p: '224.18', d: '-0.4%', up: false },
  { t: 'JPM', p: '258.77', d: '+0.8%', up: true },
  { t: 'GS', p: '592.30', d: '+1.5%', up: true },
  { t: 'NFLX', p: '1284.50', d: '-1.2%', up: false },
  { t: 'BRKA', p: '734200', d: '+0.3%', up: true },
  { t: 'V', p: '341.22', d: '+0.7%', up: true },
]

// SVG chart data — deterministic fake candlesticks, swap for real intraday later
const CANDLE_DATA = [
  { o: 540, h: 545, l: 536, c: 542 }, { o: 542, h: 548, l: 540, c: 546 },
  { o: 546, h: 549, l: 541, c: 543 }, { o: 543, h: 547, l: 538, c: 539 },
  { o: 539, h: 544, l: 537, c: 541 }, { o: 541, h: 546, l: 539, c: 544 },
  { o: 544, h: 550, l: 542, c: 548 }, { o: 548, h: 553, l: 546, c: 551 },
  { o: 551, h: 554, l: 547, c: 549 }, { o: 549, h: 555, l: 548, c: 553 },
  { o: 553, h: 556, l: 550, c: 552 }, { o: 552, h: 558, l: 551, c: 556 },
  { o: 556, h: 559, l: 553, c: 555 }, { o: 555, h: 560, l: 554, c: 558 },
  { o: 558, h: 562, l: 555, c: 560 }, { o: 560, h: 563, l: 557, c: 559 },
  { o: 559, h: 564, l: 558, c: 562 }, { o: 562, h: 566, l: 560, c: 564 },
  { o: 564, h: 567, l: 561, c: 563 }, { o: 563, h: 568, l: 562, c: 566 },
]

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [agents, setAgents] = useState<AgentState>({ data: 'idle', news: 'idle', quant: 'idle', writer: 'idle' })
  const [messages, setMessages] = useState<AgentMessage>({ data: '', news: '', quant: '', writer: '' })
  const [error, setError] = useState('')
  const [aboutOpen, setAboutOpen] = useState(false)
  const [eventLog, setEventLog] = useState<string[]>([])
  const searchRef = useRef<HTMLInputElement>(null)
  const marketsRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false })
    setEventLog(prev => [...prev.slice(-30), `[${ts}] ${msg}`])
  }

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [eventLog])

  const runResearch = async (t?: string) => {
    const sym = (t || ticker).toUpperCase().trim()
    if (!sym) return
    if (t) setTicker(sym)
    setLoading(true); setError(''); setResult(null)
    setAgents({ data: 'idle', news: 'idle', quant: 'idle', writer: 'idle' })
    setMessages({ data: '', news: '', quant: '', writer: '' })
    setEventLog([])
    addLog(`Research initiated for ${sym}`)
    try {
      const res = await fetch(((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + '/research'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: sym })
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l: string) => l.startsWith('data: '))
        for (const line of lines) {
          const json = JSON.parse(line.replace('data: ', ''))
          if (json.agent === 'complete') {
            setResult(json.result); setLoading(false)
            addLog(`Report complete for ${sym}`)
          } else {
            setAgents(p => ({ ...p, [json.agent]: json.status }))
            setMessages(p => ({ ...p, [json.agent]: json.message }))
            addLog(`[${json.agent}] ${json.message}`)
          }
        }
      }
    } catch { setError('Could not connect. Make sure the backend is running on port 8000.'); setLoading(false); addLog('Error: Backend connection failed') }
  }

  const rc = (r: string) => r === 'STRONG BUY' || r === 'BUY' ? '#22C55E' : r === 'HOLD' ? '#e8b84b' : '#EF4444'
  const focusSearch = () => searchRef.current?.focus()
  const scrollToMarkets = () => marketsRef.current?.scrollIntoView({ behavior: 'smooth' })

  const agentsArr = Object.values(agents)
  const completedCount = agentsArr.filter(s => s === 'done').length
  const anyRunning = agentsArr.some(s => s === 'running')

  // Chart scaling
  const chartW = 400, chartH = 160, padL = 38, padR = 8, padT = 8, padB = 22
  const prices = CANDLE_DATA.flatMap(c => [c.h, c.l])
  const minP = Math.min(...prices) - 2, maxP = Math.max(...prices) + 2
  const scaleY = (v: number) => padT + (chartH - padT - padB) * (1 - (v - minP) / (maxP - minP))
  const candleW = (chartW - padL - padR) / CANDLE_DATA.length

  return (
    <div style={{ minHeight: '100vh', background: '#0D0E12', color: '#e4e4ec', fontFamily: 'Inter, -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* Ticker tape */}
      <div style={{ background: '#111318', borderBottom: '1px solid rgba(100,116,139,0.15)', height: 36, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...TICKER_TAPE, ...TICKER_TAPE].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 24px', borderRight: '1px solid rgba(100,116,139,0.15)', height: '100%' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, color: '#A8B4C8', letterSpacing: '0.05em' }}>{item.t}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6a6a7a' }}>{item.p}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: item.up ? '#22C55E' : '#EF4444' }}>{item.d}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(100,116,139,0.15)', padding: '0 48px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(13,14,18,0.95)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, letterSpacing: 4, color: '#e4e4ec' }}>MOSAIC</span>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#A8B4C8' }} />
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <span onClick={focusSearch} style={{ fontSize: 12, color: '#8a8a98', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#A8B4C8'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#8a8a98'}>Research</span>
          <span onClick={scrollToMarkets} style={{ fontSize: 12, color: '#8a8a98', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#A8B4C8'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#8a8a98'}>Markets</span>
          <span onClick={() => setAboutOpen(v => !v)} style={{ fontSize: 12, color: aboutOpen ? '#A8B4C8' : '#8a8a98', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#A8B4C8'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = aboutOpen ? '#A8B4C8' : '#8a8a98'}>About</span>
        </div>
      </nav>

      {/* About panel */}
      <div style={{ maxHeight: aboutOpen ? 280 : 0, overflow: 'hidden', transition: 'max-height 0.35s ease', background: '#0f1014', borderBottom: aboutOpen ? '1px solid rgba(100,116,139,0.15)' : 'none' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: aboutOpen ? '28px 48px' : '0 48px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {AGENTS.map(({ key, label, desc }, i) => (
            <div key={key} style={{ padding: '16px', background: '#161820', border: '1px solid rgba(100,116,139,0.12)', borderRadius: 6 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#A8B4C8', letterSpacing: '0.1em', marginBottom: 8 }}>
                AGENT 0{i + 1}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4ec', marginBottom: 4 }}>{label}</div>
              <p style={{ fontSize: 12, color: '#5a5a6a', lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: result || loading ? 'auto' : 'calc(100vh - 88px)' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 48px 48px 0', borderRight: '1px solid rgba(100,116,139,0.12)' }}>
            <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 12, color: '#e4e4ec', fontFamily: 'Inter, sans-serif' }}>
              Equity research,<br />built in seconds.
            </h1>
            <p style={{ fontSize: 14, color: '#6b6b78', lineHeight: 1.6, marginBottom: 28, maxWidth: 420 }}>
              Multi-agent pipeline producing institutional-style research on any public company in under 60 seconds.
            </p>

            {/* Search */}
            <div style={{ display: 'flex', background: '#161820', border: '1px solid rgba(100,116,139,0.15)', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#4a4a5a', padding: '13px 8px 13px 16px', userSelect: 'none' }}>$</span>
              <input ref={searchRef} id="searchinput" type="text" value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && runResearch()}
                placeholder="Enter ticker — AAPL, NVDA, TSLA..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e4e4ec', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', padding: '13px 0', letterSpacing: '0.04em' }}
              />
              <button onClick={() => runResearch()} disabled={loading || !ticker}
                style={{ padding: '13px 22px', background: loading ? '#1a1b22' : '#A8B4C8', border: 'none', color: loading ? '#4a4a5a' : '#0D0E12', fontWeight: 600, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { if (!loading && ticker) (e.target as HTMLElement).style.background = '#C8D4E8' }}
                onMouseLeave={e => { if (!loading) (e.target as HTMLElement).style.background = loading ? '#1a1b22' : '#A8B4C8' }}>
                {loading ? 'Analyzing...' : 'Generate report →'}
              </button>
            </div>

            {/* Action buttons row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button onClick={() => runResearch('NVDA')}
                style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 5, color: '#8a8a98', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#A8B4C8'; (e.target as HTMLElement).style.color = '#A8B4C8' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(100,116,139,0.2)'; (e.target as HTMLElement).style.color = '#8a8a98' }}>
                View sample report (NVDA)
              </button>
            </div>

            {/* Quick tickers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3a3a45', marginRight: 4 }}>QUICK:</span>
              {SAMPLE_TICKERS.map(t => (
                <button key={t} onClick={() => runResearch(t)}
                  style={{ padding: '3px 9px', background: 'transparent', border: '1px solid rgba(100,116,139,0.12)', borderRadius: 3, color: '#4a4a5a', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.04em' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#A8B4C8'; (e.target as HTMLElement).style.color = '#A8B4C8' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(100,116,139,0.12)'; (e.target as HTMLElement).style.color = '#4a4a5a' }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Agent configuration grid */}
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.1em', marginBottom: 10 }}>AGENT CONFIGURATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {AGENTS.map(({ key, label, desc }) => {
                const status = agents[key as keyof AgentState]
                const dotColor = status === 'done' ? '#22C55E' : status === 'running' ? '#e8b84b' : '#22C55E'
                const statusLabel = status === 'done' ? 'Complete' : status === 'running' ? 'Running' : 'Operational'
                return (
                  <div key={key} style={{ padding: '10px 12px', background: '#161820', border: '1px solid rgba(100,116,139,0.12)', borderRadius: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#c8c8d4' }}>{label}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}40` }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: dotColor, letterSpacing: '0.06em' }}>{statusLabel.toUpperCase()}</span>
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#5a5a66' }}>{desc}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right — chart + event log */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 0 48px 32px', gap: 12 }}>

            {/* Chart with proper axes */}
            <div style={{ border: '1px solid rgba(100,116,139,0.12)', borderRadius: 8, background: '#161820', padding: '16px 16px 10px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#A8B4C8' }}>SPY</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600, color: '#e4e4ec' }}>$566.20</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#22C55E' }}>+0.32%</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['1D', '1W', '1M'].map((tf, i) => (
                    <span key={tf} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: i === 0 ? '#A8B4C8' : '#3a3a45', padding: '3px 8px', borderRadius: 3, background: i === 0 ? 'rgba(168,180,200,0.1)' : 'transparent', cursor: 'pointer', letterSpacing: '0.05em' }}>{tf}</span>
                  ))}
                </div>
              </div>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height="160" style={{ display: 'block' }}>
                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                  const val = minP + pct * (maxP - minP)
                  const y = scaleY(val)
                  return (
                    <g key={pct}>
                      <line x1={padL} x2={chartW - padR} y1={y} y2={y} stroke="rgba(100,116,139,0.08)" strokeWidth="0.5" />
                      <text x={padL - 4} y={y + 3} textAnchor="end" fill="#3a3a45" fontSize="8" fontFamily="JetBrains Mono, monospace">{val.toFixed(0)}</text>
                    </g>
                  )
                })}
                {/* Candlesticks */}
                {CANDLE_DATA.map((c, i) => {
                  const x = padL + i * candleW + candleW * 0.2
                  const w = candleW * 0.6
                  const up = c.c >= c.o
                  const bodyTop = scaleY(Math.max(c.o, c.c))
                  const bodyH = Math.max(Math.abs(scaleY(c.o) - scaleY(c.c)), 1.5)
                  return (
                    <g key={i}>
                      <line x1={x + w / 2} x2={x + w / 2} y1={scaleY(c.h)} y2={scaleY(c.l)} stroke={up ? '#22C55E' : '#EF4444'} strokeWidth="1" opacity="0.6" />
                      <rect x={x} y={bodyTop} width={w} height={bodyH} fill={up ? '#22C55E' : '#EF4444'} opacity="0.85" rx="0.5" />
                    </g>
                  )
                })}
                {/* Moving average line */}
                <polyline
                  points={CANDLE_DATA.map((c, i) => `${padL + i * candleW + candleW / 2},${scaleY((c.o + c.c) / 2)}`).join(' ')}
                  fill="none" stroke="#A8B4C8" strokeWidth="1.2" opacity="0.4" strokeLinejoin="round"
                />
                {/* X-axis time labels */}
                {[0, 5, 10, 15, 19].map(i => (
                  <text key={i} x={padL + i * candleW + candleW / 2} y={chartH - 4} textAnchor="middle" fill="#3a3a45" fontSize="8" fontFamily="JetBrains Mono, monospace">
                    {`${9 + Math.floor(i * 0.35)}:${String(Math.floor((i * 21) % 60)).padStart(2, '0')}`}
                  </text>
                ))}
              </svg>
            </div>

            {/* Pipeline status — compact */}
            <div style={{ border: '1px solid rgba(100,116,139,0.12)', borderRadius: 8, background: '#161820', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.1em' }}>PIPELINE STATUS</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: anyRunning ? '#e8b84b' : '#4a4a5a' }}>
                  {anyRunning ? `● ${completedCount}/4 COMPLETE` : loading ? '● INITIALIZING' : 'IDLE'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
                {anyRunning && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(168,180,200,0.12), transparent)', animation: 'scan 1.8s linear infinite', pointerEvents: 'none', borderRadius: 4 }} />
                )}
                {AGENTS.map(({ key, label }, i) => {
                  const status = agents[key as keyof AgentState]
                  const tc = status === 'done' ? '#22C55E' : status === 'running' ? '#A8B4C8' : '#3a3a45'
                  const bg = status === 'done' ? 'rgba(34,197,94,0.06)' : status === 'running' ? 'rgba(168,180,200,0.06)' : 'transparent'
                  return (
                    <div key={key} style={{ flex: 1, padding: '8px 6px', borderRadius: 4, background: bg, border: '1px solid rgba(100,116,139,0.1)', textAlign: 'center', transition: 'all 0.3s' }}>
                      <div style={{ fontSize: 6, color: tc, marginBottom: 3, animation: status === 'running' ? 'blink 0.8s infinite' : 'none' }}>●</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, color: tc, letterSpacing: '0.06em' }}>{label.split(' ')[0].toUpperCase()}</div>
                      {i < 3 && <div style={{ position: 'absolute', right: -3, top: '50%', fontSize: 8, color: '#2a2a32', transform: 'translateY(-50%)' }} />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Real event log — shows actual SSE events, not fake messages */}
            <div style={{ border: '1px solid rgba(100,116,139,0.12)', borderRadius: 8, background: '#111318', flex: 1, minHeight: 160, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(100,116,139,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.1em' }}>EVENT LOG</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: eventLog.length > 0 ? '#22C55E' : '#3a3a45' }}>
                  {eventLog.length > 0 ? `● ${eventLog.length} events` : 'WAITING'}
                </span>
              </div>
              <div ref={logRef} style={{ flex: 1, padding: '8px 14px', overflowY: 'auto', maxHeight: 140 }}>
                {eventLog.length === 0 ? (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2a2a35', lineHeight: 1.8 }}>
                    Waiting for research pipeline...<br />
                    Enter a ticker and generate a report to see live agent events.
                  </div>
                ) : (
                  eventLog.map((log, i) => (
                    <div key={i} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: log.includes('Error') ? '#EF4444' : log.includes('complete') || log.includes('Complete') ? '#22C55E' : '#6b6b78', lineHeight: 1.7 }}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Markets snapshot */}
      <div ref={marketsRef} style={{ borderTop: '1px solid rgba(100,116,139,0.12)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 48px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.12em', marginBottom: 14 }}>MARKETS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, border: '1px solid rgba(100,116,139,0.12)', borderRadius: 6, overflow: 'hidden' }}>
            {TICKER_TAPE.slice(0, 6).map((item, i) => (
              <div key={item.t} onClick={() => runResearch(item.t)}
                style={{ padding: '14px 12px', background: '#161820', borderRight: i < 5 ? '1px solid rgba(100,116,139,0.08)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a1b22')}
                onMouseLeave={e => (e.currentTarget.style.background = '#161820')}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, color: '#A8B4C8', marginBottom: 4 }}>{item.t}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#e4e4ec', marginBottom: 2 }}>{item.p}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: item.up ? '#22C55E' : '#EF4444' }}>{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline + Results */}
      {(loading || result) && (
        <div style={{ borderTop: '1px solid rgba(100,116,139,0.12)', background: '#0D0E12' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 48px' }}>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a4a5a', letterSpacing: '0.12em' }}>PIPELINE · {ticker}</span>
                {loading && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#e8b84b', animation: 'blink 1s infinite', letterSpacing: '0.1em' }}>● RUNNING</span>}
                {result && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#22C55E', letterSpacing: '0.1em' }}>● COMPLETE</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, border: '1px solid rgba(100,116,139,0.12)', borderRadius: 6, overflow: 'hidden' }}>
                {AGENTS.map(({ key, label, desc }) => {
                  const status = agents[key as keyof AgentState]
                  const msg = messages[key as keyof AgentMessage]
                  const bc = status === 'done' ? 'rgba(34,197,94,0.06)' : status === 'running' ? 'rgba(168,180,200,0.06)' : '#161820'
                  const tc = status === 'done' ? '#22C55E' : status === 'running' ? '#A8B4C8' : '#3a3a45'
                  return (
                    <div key={key} style={{ padding: '14px 18px', background: bc, borderRight: '1px solid rgba(100,116,139,0.08)', transition: 'all 0.3s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                        <span style={{ fontSize: 6, color: tc, animation: status === 'running' ? 'blink 0.8s infinite' : 'none' }}>●</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: tc, letterSpacing: '0.1em' }}>{label.split(' ')[0].toUpperCase()}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#4a4a5a', lineHeight: 1.4 }}>{msg || desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#EF4444', fontSize: 12, marginBottom: 20 }}>{error}</div>}

            {result && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 12, padding: '22px 28px', background: '#161820', border: '1px solid rgba(100,116,139,0.12)', borderRadius: 8, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.15em', marginBottom: 6 }}>{result.ticker} · {result.data.sector} · {result.data.industry}</div>
                    <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: '#e4e4ec', marginBottom: 6 }}>{result.company_name}</h2>
                    <p style={{ fontSize: 12, color: '#4a4a5a', lineHeight: 1.6, maxWidth: 700 }}>{result.data.summary?.slice(0, 200)}...</p>
                  </div>
                  <div style={{ textAlign: 'right', paddingLeft: 32, borderLeft: '1px solid rgba(100,116,139,0.12)' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.12em', marginBottom: 8 }}>LAST PRICE</div>
                    <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-1.5px', color: '#e4e4ec', lineHeight: 1, marginBottom: 10 }}>${result.current_price?.toFixed(2)}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: rc(result.overall), padding: '5px 14px', background: `${rc(result.overall)}12`, border: `1px solid ${rc(result.overall)}30`, borderRadius: 3, display: 'inline-block', letterSpacing: '0.08em' }}>{result.overall}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 12, border: '1px solid rgba(100,116,139,0.12)', borderRadius: 6, overflow: 'hidden' }}>
                  {[
                    { label: 'P/E RATIO', value: result.data.pe_ratio?.toFixed(2) ?? '—' },
                    { label: 'REVENUE GROWTH', value: result.data.revenue_growth ? `${(result.data.revenue_growth * 100).toFixed(1)}%` : '—' },
                    { label: 'NET MARGIN', value: result.data.profit_margins ? `${(result.data.profit_margins * 100).toFixed(1)}%` : '—' },
                    { label: 'ANALYST TARGET', value: result.data.target_price ? `$${result.data.target_price?.toFixed(2)}` : '—' },
                  ].map((m, i) => (
                    <div key={m.label} style={{ padding: '18px 22px', background: '#161820', borderRight: i < 3 ? '1px solid rgba(100,116,139,0.08)' : 'none' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.12em', marginBottom: 8 }}>{m.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 600, color: '#e4e4ec', letterSpacing: '-0.5px' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12 }}>
                  <div style={{ padding: '18px', background: '#161820', border: '1px solid rgba(100,116,139,0.12)', borderRadius: 8, alignSelf: 'start' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#A8B4C8', letterSpacing: '0.15em', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(100,116,139,0.08)' }}>◆ QUANT SIGNALS</div>
                    {Object.entries(result.analysis).filter(([k]) => k !== 'overall').map(([key, value]) => (
                      <div key={key} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(100,116,139,0.05)' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3a3a45', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{key}</div>
                        <div style={{ fontSize: 11, color: '#9090a8', lineHeight: 1.4 }}>{String(value)}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '28px 32px', background: '#161820', border: '1px solid rgba(100,116,139,0.12)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid rgba(100,116,139,0.08)' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#A8B4C8', letterSpacing: '0.15em' }}>◆ EQUITY RESEARCH REPORT</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#2a2a35' }}>MOSAIC · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>
                    <div className="report">
                      <ReactMarkdown>{result.report}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform footer */}
      <div style={{ borderTop: '1px solid rgba(100,116,139,0.12)', background: '#0a0b0e' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3a3a45', letterSpacing: '0.1em', marginBottom: 10 }}>STACK</div>
            <div style={{ fontSize: 11, color: '#5a5a66', lineHeight: 1.8 }}>
              Next.js · FastAPI · SSE streaming<br />
              yfinance · Tavily · Anthropic Claude<br />
              Deployed: Vercel + Render
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3a3a45', letterSpacing: '0.1em', marginBottom: 10 }}>ARCHITECTURE</div>
            <div style={{ fontSize: 11, color: '#5a5a66', lineHeight: 1.8 }}>
              Multi-agent pipeline (4 specialized agents)<br />
              Server-Sent Events for real-time status<br />
              ~58s average end-to-end generation
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3a3a45', letterSpacing: '0.1em', marginBottom: 10 }}>SOURCE</div>
            <div style={{ fontSize: 11, color: '#5a5a66', lineHeight: 1.8 }}>
              <a href="https://github.com/anibhati" target="_blank" rel="noopener noreferrer" style={{ color: '#A8B4C8', textDecoration: 'none' }}>github.com/anibhati</a><br />
              Built by Aniruddha Bhati<br />
              Ohio State University · CSE
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 48px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(100,116,139,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2a2a35', letterSpacing: 3 }}>MOSAIC</span>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2a2a35' }} />
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#2a2a35' }}>Multi-Agent Equity Research Platform</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes blink { 0%, 100% { opacity: 0.3 } 50% { opacity: 1 } }
        @keyframes scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #2a2a35; font-family: 'JetBrains Mono', monospace; }
        .report { color: #8888a0; line-height: 1.85; font-size: 14px; }
        .report h1, .report h2 { color: #e4e4ec; font-size: 15px; font-weight: 600; margin: 26px 0 10px; letter-spacing: -0.2px; border-bottom: 1px solid rgba(100,116,139,0.12); padding-bottom: 8px; }
        .report h3 { color: #b8b8cc; font-size: 13px; font-weight: 600; margin: 18px 0 8px; }
        .report p { margin-bottom: 14px; }
        .report strong { color: #c8c8dc; font-weight: 600; }
        .report table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .report th { text-align: left; padding: 8px 12px; border-bottom: 1px solid rgba(100,116,139,0.12); color: #4a4a5a; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
        .report td { padding: 9px 12px; border-bottom: 1px solid rgba(100,116,139,0.05); color: #9090a8; font-size: 13px; }
        .report hr { border: none; border-top: 1px solid rgba(100,116,139,0.12); margin: 22px 0; }
        .report ul, .report ol { padding-left: 20px; margin-bottom: 14px; }
        .report li { margin-bottom: 5px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0D0E12; }
        ::-webkit-scrollbar-thumb { background: #1e1e26; border-radius: 2px; }
      `}</style>
    </div>
  )
}