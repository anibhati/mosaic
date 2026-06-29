'use client'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

type AgentStatus = 'idle' | 'running' | 'done'
interface AgentState { data: AgentStatus; news: AgentStatus; quant: AgentStatus; writer: AgentStatus }
interface AgentMessage { data: string; news: string; quant: string; writer: string }

const AGENTS = [
  { key: 'data', label: 'Data', desc: 'Live financials from market feeds' },
  { key: 'news', label: 'News', desc: 'Headlines and earnings calls' },
  { key: 'quant', label: 'Quant', desc: 'Valuation and risk models' },
  { key: 'writer', label: 'Report', desc: 'Structured research report' },
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

const FEATURE_CARDS = [
  {
    img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&q=80',
    label: 'Live market data',
    desc: 'Price, revenue, margins, P/E, debt, and analyst targets — pulled directly from market feeds the moment you search.',
  },
  {
    img: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=700&q=80',
    label: 'News intelligence',
    desc: 'Scans recent headlines, earnings transcripts, and analyst commentary. What the numbers miss, the news captures.',
  },
  {
    img: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=700&q=80',
    label: 'Quantitative models',
    desc: 'Systematic scoring across valuation, growth, profitability, and risk. The same logic institutional funds run.',
  },
  {
    img: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=700&q=80',
    label: 'Institutional reports',
    desc: 'A structured equity research report — executive summary, financial analysis, risk factors, and a clear recommendation.',
  },
]

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [agents, setAgents] = useState<AgentState>({ data: 'idle', news: 'idle', quant: 'idle', writer: 'idle' })
  const [messages, setMessages] = useState<AgentMessage>({ data: '', news: '', quant: '', writer: '' })
  const [error, setError] = useState('')

  const runResearch = async (t?: string) => {
    const sym = (t || ticker).toUpperCase().trim()
    if (!sym) return
    if (t) setTicker(sym)
    setLoading(true); setError(''); setResult(null)
    setAgents({ data: 'idle', news: 'idle', quant: 'idle', writer: 'idle' })
    setMessages({ data: '', news: '', quant: '', writer: '' })
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
          if (json.agent === 'complete') { setResult(json.result); setLoading(false) }
          else { setAgents(p => ({ ...p, [json.agent]: json.status })); setMessages(p => ({ ...p, [json.agent]: json.message })) }
        }
      }
    } catch { setError('Could not connect. Make sure the backend is running on port 8000.'); setLoading(false) }
  }

  const rc = (r: string) => r === 'STRONG BUY' || r === 'BUY' ? '#2ecc8a' : r === 'HOLD' ? '#e8b84b' : '#e05555'

  return (
    <div style={{ minHeight: '100vh', background: '#08080c', color: '#e4e4ec', fontFamily: 'Inter, -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* Ticker tape */}
      <div style={{ background: '#0d0d12', borderBottom: '1px solid #16161e', height: 36, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...TICKER_TAPE, ...TICKER_TAPE].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 24px', borderRight: '1px solid #16161e', height: '100%' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, color: '#A8B4C8', letterSpacing: '0.05em' }}>{item.t}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6a6a7a' }}>{item.p}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: item.up ? '#2ecc8a' : '#e05555' }}>{item.d}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #16161e', padding: '0 48px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(8,8,12,0.95)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, letterSpacing: 4, color: '#e4e4ec' }}>MOSAIC</span>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#A8B4C8' }} />
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#4a4a5a', cursor: 'pointer' }}>Research</span>
          <span style={{ fontSize: 12, color: '#4a4a5a', cursor: 'pointer' }}>Markets</span>
          <span style={{ fontSize: 12, color: '#4a4a5a', cursor: 'pointer' }}>About</span>
          <button onClick={() => document.getElementById('searchinput')?.focus()}
            style={{ padding: '6px 16px', background: 'transparent', border: '1px solid #A8B4C8', borderRadius: 4, color: '#A8B4C8', fontSize: 12, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.04em', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = '#A8B4C8'; (e.target as HTMLElement).style.color = '#08080c' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#A8B4C8' }}>
            Start researching
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', minHeight: 'calc(100vh - 88px)', borderRight: '1px solid #16161e' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px 80px 0', borderRight: '1px solid #16161e' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2ecc8a', animation: 'blink 2s infinite' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a4a5a', letterSpacing: '0.15em' }}>LIVE DATA · AI-POWERED · REAL-TIME ANALYSIS</span>
            </div>

            <h1 style={{ fontSize: 62, fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.03, marginBottom: 24, color: '#e4e4ec', fontFamily: 'Inter, sans-serif' }}>
              Equity research<br />
              that used to take<br />
              <span style={{ color: '#A8B4C8', fontStyle: 'italic' }}>analysts two days.</span>
            </h1>

            <p style={{ fontSize: 17, color: '#5a5a6a', lineHeight: 1.7, marginBottom: 44, maxWidth: 460 }}>
              Four AI agents — data, news, quant, and writer — collaborate to produce institutional-grade research on any public company in under 60 seconds.
            </p>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', background: '#0d0d12', border: '1px solid #25252e', borderRadius: 6, overflow: 'hidden', transition: 'border-color 0.2s' }}
                onFocus={() => {}} >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#4a4a5a', padding: '15px 8px 15px 20px', userSelect: 'none' }}>$</span>
                <input
                  id="searchinput"
                  type="text" value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && runResearch()}
                  placeholder="Enter ticker — AAPL, NVDA, TSLA, GS..."
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e4e4ec', fontSize: 15, fontFamily: 'JetBrains Mono, monospace', padding: '15px 0', letterSpacing: '0.05em' }}
                />
                <button onClick={() => runResearch()} disabled={loading || !ticker}
                  style={{ padding: '15px 28px', background: loading ? '#16161e' : '#A8B4C8', border: 'none', color: loading ? '#4a4a5a' : '#08080c', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { if (!loading && ticker) (e.target as HTMLElement).style.background = '#C8D4E8' }}
                  onMouseLeave={e => { if (!loading) (e.target as HTMLElement).style.background = loading ? '#16161e' : '#A8B4C8' }}>
                  {loading ? 'Analyzing...' : 'Generate report →'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3a3a45', marginRight: 4 }}>QUICK:</span>
              {SAMPLE_TICKERS.map(t => (
                <button key={t} onClick={() => runResearch(t)}
                  style={{ padding: '3px 10px', background: 'transparent', border: '1px solid #1e1e26', borderRadius: 3, color: '#4a4a5a', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.05em' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#A8B4C8'; (e.target as HTMLElement).style.color = '#A8B4C8' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#1e1e26'; (e.target as HTMLElement).style.color = '#4a4a5a' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Right — photo + stats */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 0 80px 48px', gap: 14 }}>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #16161e', height: 240, position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80" alt="Financial data terminals"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55) saturate(0.6) contrast(1.1)' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16, display: 'flex', gap: 6 }}>
                {['DATA', 'NEWS', 'QUANT', 'REPORT'].map((a, i) => (
                  <div key={a} style={{ flex: 1, padding: '6px 8px', background: 'rgba(8,8,12,0.85)', border: '1px solid rgba(168,180,200,0.2)', borderRadius: 4, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#A8B4C8', letterSpacing: '0.1em' }}>{a}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#3a3a45', marginTop: 2 }}>AGENT 0{i+1}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'EQUITIES COVERED', value: '10,000+', sub: 'Global markets' },
                { label: 'REPORT TIME', value: '~60s', sub: 'End-to-end', platinum: true },
                { label: 'DATA SOURCES', value: 'Live', sub: 'Real-time feeds' },
                { label: 'AI AGENTS', value: '4', sub: 'Specialized' },
              ].map(m => (
                <div key={m.label} style={{ padding: '16px', background: '#0d0d12', border: '1px solid #16161e', borderRadius: 6 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.12em', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.platinum ? '#A8B4C8' : '#e4e4ec', letterSpacing: '-0.5px', lineHeight: 1 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#3a3a45', marginTop: 4 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline + Results */}
      {(loading || result) && (
        <div style={{ borderTop: '1px solid #16161e', background: '#08080c' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 48px' }}>

            {/* Pipeline */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a4a5a', letterSpacing: '0.12em' }}>PIPELINE · {ticker}</span>
                {loading && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#e8b84b', animation: 'blink 1s infinite', letterSpacing: '0.1em' }}>● RUNNING</span>}
                {result && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#2ecc8a', letterSpacing: '0.1em' }}>● COMPLETE</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, border: '1px solid #16161e', borderRadius: 6, overflow: 'hidden' }}>
                {AGENTS.map(({ key, label, desc }) => {
                  const status = agents[key as keyof AgentState]
                  const msg = messages[key as keyof AgentMessage]
                  const bc = status === 'done' ? 'rgba(46,204,138,0.08)' : status === 'running' ? 'rgba(168,180,200,0.06)' : '#0d0d12'
                  const tc = status === 'done' ? '#2ecc8a' : status === 'running' ? '#A8B4C8' : '#3a3a45'
                  return (
                    <div key={key} style={{ padding: '14px 18px', background: bc, borderRight: '1px solid #16161e', transition: 'all 0.3s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                        <span style={{ fontSize: 6, color: tc, animation: status === 'running' ? 'blink 0.8s infinite' : 'none' }}>●</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: tc, letterSpacing: '0.1em' }}>{label.toUpperCase()}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#4a4a5a', lineHeight: 1.4 }}>{msg || desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Error */}
            {error && <div style={{ padding: '10px 14px', background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: 4, color: '#e05555', fontSize: 12, marginBottom: 20 }}>{error}</div>}

            {/* Results */}
            {result && (
              <div>
                {/* Company + price header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 12, padding: '22px 28px', background: '#0d0d12', border: '1px solid #16161e', borderRadius: 8, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.15em', marginBottom: 6 }}>{result.ticker} · {result.data.sector} · {result.data.industry}</div>
                    <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: '#e4e4ec', marginBottom: 6 }}>{result.company_name}</h2>
                    <p style={{ fontSize: 12, color: '#4a4a5a', lineHeight: 1.6, maxWidth: 700 }}>{result.data.summary?.slice(0, 200)}...</p>
                  </div>
                  <div style={{ textAlign: 'right', paddingLeft: 32, borderLeft: '1px solid #16161e' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.12em', marginBottom: 8 }}>LAST PRICE</div>
                    <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-1.5px', color: '#e4e4ec', lineHeight: 1, marginBottom: 10 }}>${result.current_price?.toFixed(2)}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: rc(result.overall), padding: '5px 14px', background: `${rc(result.overall)}12`, border: `1px solid ${rc(result.overall)}30`, borderRadius: 3, display: 'inline-block', letterSpacing: '0.08em' }}>{result.overall}</div>
                  </div>
                </div>

                {/* Metrics row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 12, border: '1px solid #16161e', borderRadius: 6, overflow: 'hidden' }}>
                  {[
                    { label: 'P/E RATIO', value: result.data.pe_ratio?.toFixed(2) ?? '—' },
                    { label: 'REVENUE GROWTH', value: result.data.revenue_growth ? `${(result.data.revenue_growth * 100).toFixed(1)}%` : '—' },
                    { label: 'NET MARGIN', value: result.data.profit_margins ? `${(result.data.profit_margins * 100).toFixed(1)}%` : '—' },
                    { label: 'ANALYST TARGET', value: result.data.target_price ? `$${result.data.target_price?.toFixed(2)}` : '—' },
                  ].map((m, i) => (
                    <div key={m.label} style={{ padding: '18px 22px', background: '#0d0d12', borderRight: i < 3 ? '1px solid #16161e' : 'none' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: '0.12em', marginBottom: 8 }}>{m.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 600, color: '#e4e4ec', letterSpacing: '-0.5px' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Quant + Report */}
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12 }}>
                  <div style={{ padding: '18px', background: '#0d0d12', border: '1px solid #16161e', borderRadius: 8, alignSelf: 'start' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#A8B4C8', letterSpacing: '0.15em', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #16161e' }}>◆ QUANT SIGNALS</div>
                    {Object.entries(result.analysis).filter(([k]) => k !== 'overall').map(([key, value]) => (
                      <div key={key} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #0f0f14' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3a3a45', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{key}</div>
                        <div style={{ fontSize: 11, color: '#9090a8', lineHeight: 1.4 }}>{String(value)}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '28px 32px', background: '#0d0d12', border: '1px solid #16161e', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid #16161e' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#A8B4C8', letterSpacing: '0.15em' }}>◆ EQUITY RESEARCH REPORT</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#2a2a35' }}>MOSAIC AI · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
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

      {/* Landing sections — hidden after analysis */}
      {!result && !loading && (
        <>
          {/* How it works */}
          <div style={{ borderTop: '1px solid #16161e' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 80, alignItems: 'start' }}>
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#A8B4C8', letterSpacing: '0.15em', marginBottom: 12 }}>HOW IT WORKS</p>
                  <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: '#e4e4ec', lineHeight: 1.15, marginBottom: 16 }}>Four agents.<br />One report.</h2>
                  <p style={{ fontSize: 14, color: '#4a4a5a', lineHeight: 1.7 }}>Each agent specializes in one part of the research pipeline. Together they produce what would take a junior analyst two days.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, border: '1px solid #16161e', borderRadius: 8, overflow: 'hidden' }}>
                  {AGENTS.map(({ key, label, desc }, i) => (
                    <div key={key} style={{ padding: '28px', background: '#0d0d12', borderRight: i % 2 === 0 ? '1px solid #16161e' : 'none', borderBottom: i < 2 ? '1px solid #16161e' : 'none' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#A8B4C8', letterSpacing: '0.1em', marginBottom: 14 }}>AGENT 0{i+1} · {label.toUpperCase()}</div>
                      <p style={{ fontSize: 13, color: '#5a5a6a', lineHeight: 1.65 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Features with photos */}
          <div style={{ borderTop: '1px solid #16161e', background: '#060609' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px' }}>
              <div style={{ marginBottom: 48 }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#A8B4C8', letterSpacing: '0.15em', marginBottom: 12 }}>FEATURES</p>
                <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: '#e4e4ec' }}>Built for serious analysis.</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {FEATURE_CARDS.map(({ img, label, desc }) => (
                  <div key={label} style={{ border: '1px solid #16161e', borderRadius: 8, overflow: 'hidden', background: '#0d0d12', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#A8B4C8')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#16161e')}>
                    <div style={{ height: 180, overflow: 'hidden' }}>
                      <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5) saturate(0.5)', transition: 'transform 0.5s, filter 0.3s' }}
                        onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; (e.target as HTMLImageElement).style.filter = 'brightness(0.65) saturate(0.7)' }}
                        onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; (e.target as HTMLImageElement).style.filter = 'brightness(0.5) saturate(0.5)' }} />
                    </div>
                    <div style={{ padding: '20px 24px' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#A8B4C8', letterSpacing: '0.1em', marginBottom: 8 }}>{label.toUpperCase()}</div>
                      <p style={{ fontSize: 13, color: '#5a5a6a', lineHeight: 1.65 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ borderTop: '1px solid #16161e' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#A8B4C8', letterSpacing: '0.15em', marginBottom: 16 }}>GET STARTED</p>
                <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1.5px', color: '#e4e4ec', lineHeight: 1.1, marginBottom: 16 }}>Any ticker.<br />Any time.</h2>
                <p style={{ fontSize: 14, color: '#4a4a5a', lineHeight: 1.7, marginBottom: 32 }}>No account required. No API key. Enter any public ticker and get a full institutional-grade research report in under 60 seconds.</p>
                <button onClick={() => document.getElementById('searchinput')?.focus()}
                  style={{ padding: '13px 32px', background: '#A8B4C8', border: 'none', borderRadius: 5, color: '#08080c', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: '0.02em', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.background = '#C8D4E8'}
                  onMouseLeave={e => (e.target as HTMLElement).style.background = '#A8B4C8'}>
                  Generate your first report →
                </button>
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #16161e', height: 300 }}>
                <img src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80" alt="Trading floor"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45) saturate(0.5)' }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #16161e', padding: '18px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#060609' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2a2a35', letterSpacing: 3 }}>MOSAIC</span>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2a2a35' }} />
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#2a2a35' }}>Powered by Multi-Agent AI · yfinance · Tavily</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes blink { 0%, 100% { opacity: 0.3 } 50% { opacity: 1 } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #2a2a35; font-family: 'JetBrains Mono', monospace; }
        .report { color: #8888a0; line-height: 1.85; font-size: 14px; }
        .report h1, .report h2 { color: #e4e4ec; font-size: 15px; font-weight: 600; margin: 26px 0 10px; letter-spacing: -0.2px; border-bottom: 1px solid #16161e; padding-bottom: 8px; }
        .report h3 { color: #b8b8cc; font-size: 13px; font-weight: 600; margin: 18px 0 8px; }
        .report p { margin-bottom: 14px; }
        .report strong { color: #c8c8dc; font-weight: 600; }
        .report table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .report th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #16161e; color: #4a4a5a; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
        .report td { padding: 9px 12px; border-bottom: 1px solid #0f0f14; color: #9090a8; font-size: 13px; }
        .report hr { border: none; border-top: 1px solid #16161e; margin: 22px 0; }
        .report ul, .report ol { padding-left: 20px; margin-bottom: 14px; }
        .report li { margin-bottom: 5px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #08080c; }
        ::-webkit-scrollbar-thumb { background: #1e1e26; border-radius: 2px; }
      `}</style>
    </div>
  )
}