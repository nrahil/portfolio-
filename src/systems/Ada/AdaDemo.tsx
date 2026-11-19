import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import './ada.css'

type N = { id: string; x: number; y: number; label: string; info: string }
const NODES: N[] = [
  { id: 'q', x: 40, y: 150, label: 'query', info: 'A research question arrives through the FastAPI backend; the run is executed asynchronously by Celery workers.' },
  { id: 'plan', x: 140, y: 150, label: 'planner', info: 'Decomposes the question into focused sub-queries - each becomes its own research track.' },
  { id: 't1', x: 270, y: 66, label: 'track', info: 'Bounded parallel research track: gathers evidence from web search and the user-scoped private store in Qdrant.' },
  { id: 't2', x: 270, y: 150, label: 'track', info: 'Tracks run in parallel with an upper bound, so one question cannot fan out without limit.' },
  { id: 't3', x: 270, y: 234, label: 'track', info: 'Each track drafts its section grounded in retrieved evidence (RAG).' },
  { id: 'critic', x: 400, y: 150, label: 'critic', info: 'Adversarial critic: attacks each draft - unsupported claims, gaps, weak sources.' },
  { id: 'arb', x: 510, y: 150, label: 'arbiter', info: 'Arbiter weighs the critique and decides: accept the section, or send it back for revision.' },
  { id: 'syn', x: 620, y: 150, label: 'synthesis', info: 'Accepted sections are synthesized into one coherent report.' },
  { id: 'ver', x: 730, y: 150, label: 'verify', info: 'Claim and citation verification: every claim is checked against its cited evidence before the report ships.' },
  { id: 'out', x: 830, y: 150, label: 'report', info: 'Final, cited report. Every run is traced in Langfuse.' },
]
const E: [string, string][] = [['q', 'plan'], ['plan', 't1'], ['plan', 't2'], ['plan', 't3'], ['t1', 'critic'], ['t2', 'critic'], ['t3', 'critic'], ['critic', 'arb'], ['arb', 'syn'], ['syn', 'ver'], ['ver', 'out']]
const byId = (id: string) => NODES.find((n) => n.id === id)!

const RUN: { on: string[]; edge?: string[]; loop?: boolean; say: string }[] = [
  { on: ['q'], say: 'question received' },
  { on: ['plan'], edge: ['q-plan'], say: 'planner decomposes it into sub-queries' },
  { on: ['t1', 't2', 't3'], edge: ['plan-t1', 'plan-t2', 'plan-t3'], say: 'bounded parallel tracks retrieve evidence - web + private (Qdrant)' },
  { on: ['critic'], edge: ['t1-critic', 't2-critic', 't3-critic'], say: 'critic challenges the drafts' },
  { on: ['arb'], edge: ['critic-arb'], say: 'arbiter: one section is under-supported → revise' },
  { on: ['t2'], loop: true, say: 'revision loops back to its track for more evidence' },
  { on: ['critic'], edge: ['t2-critic'], say: 'critic re-checks the revised section' },
  { on: ['arb'], edge: ['critic-arb'], say: 'arbiter accepts' },
  { on: ['syn'], edge: ['arb-syn'], say: 'sections synthesized into a report' },
  { on: ['ver'], edge: ['syn-ver'], say: 'claims and citations verified against evidence' },
  { on: ['out'], edge: ['ver-out'], say: 'cited report delivered · run traced in Langfuse' },
]

function Graph() {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [sel, setSel] = useState<string>('critic')
  const t = useRef<number>()

  useEffect(() => {
    if (!playing) return
    t.current = window.setTimeout(() => {
      setStep((s) => { if (s >= RUN.length - 1) { setPlaying(false); return s } return s + 1 })
    }, reduced ? 300 : 1000)
    return () => clearTimeout(t.current)
  }, [playing, step, reduced])

  const cur = step >= 0 ? RUN[step] : null
  const lit = new Set(cur?.on ?? [])
  const litE = new Set(cur?.edge ?? [])
  const visited = new Set(RUN.slice(0, step + 1).flatMap((r) => r.on))

  return (
    <div className="panel">
      <div className="panel__head">
        <span>langgraph pipeline · illustrative run</span>
        <span className="demo__row">
          <button type="button" className="btn btn--sm" onClick={() => { if (step >= RUN.length - 1) setStep(-1); setPlaying((p) => !p) }}>{playing ? 'pause' : step >= RUN.length - 1 ? 'replay' : 'play'}</button>
          <button type="button" className="btn btn--sm" onClick={() => { setPlaying(false); setStep((s) => Math.min(RUN.length - 1, s + 1)) }} disabled={step >= RUN.length - 1}>step →</button>
          <button type="button" className="btn btn--sm" onClick={() => { setPlaying(false); setStep(-1) }}>reset</button>
        </span>
      </div>
      <div className="ada__wrap">
        <svg viewBox="0 0 870 330" className="ada" role="group" aria-label="Ada research graph">
          <rect x="120" y="296" width="650" height="24" className="ada__bus" />
          <text x="445" y="312" textAnchor="middle" className="ada__bustxt">LiteLLM gateway - routing · fallback · rate limiting · output validation</text>
          {['plan', 't1', 't2', 't3', 'critic', 'arb', 'syn', 'ver'].map((id) => <line key={id} x1={byId(id).x} x2={byId(id).x} y1={byId(id).y + 14} y2={296} className="ada__tap" />)}
          <rect x="120" y="8" width="650" height="20" className="ada__bus ada__bus--trace" />
          <text x="445" y="22" textAnchor="middle" className="ada__bustxt">Langfuse tracing on every node</text>
          {E.map(([a, b]) => {
            const p = byId(a), q = byId(b)
            const k = `${a}-${b}`
            return <line key={k} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className={`ada__edge${litE.has(k) ? ' is-on' : ''}`} />
          })}
          <path d="M510 136 C 470 40, 330 40, 284 136" className={`ada__loop${cur?.loop ? ' is-on' : ''}`} />
          <text x="400" y="50" textAnchor="middle" className="ada__looptxt">revise</text>
          {NODES.map((n) => (
            <g
              key={n.id}
              transform={`translate(${n.x} ${n.y})`}
              className={`ada__node${lit.has(n.id) ? ' is-on' : visited.has(n.id) ? ' is-seen' : ''}${sel === n.id ? ' is-sel' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`${n.label}: ${n.info}`}
              onClick={() => setSel(n.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(n.id) } }}
              data-cursor="inspect"
            >
              <circle r="14" />
              <text y="34" textAnchor="middle">{n.label}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="ada__info">
        <p className="mono ada__say" aria-live="polite">{cur ? <><span className="signal">step {step + 1}/{RUN.length}</span> · {cur.say}</> : <span className="dim">press play - or click any node to read what it does</span>}</p>
        <p><b className="mono">{byId(sel).label}</b> - {byId(sel).info}</p>
      </div>
    </div>
  )
}

function Eval() {
  const rows = [
    { k: 'claim-verification accuracy', a: 70.8, b: 79.2, fmt: (v: number) => `${v.toFixed(1)}%`, max: 100 },
    { k: 'macro-F1', a: 0.639, b: 0.769, fmt: (v: number) => v.toFixed(3), max: 1 },
  ]
  return (
    <div className="panel">
      <div className="panel__head"><span>evaluation · 24-claim benchmark · before → after prompt calibration</span></div>
      <div className="ada__eval">
        {rows.map((r) => (
          <div key={r.k} className="ada__erow">
            <span className="mono demo__note">{r.k}</span>
            <div className="ada__bars">
              <div className="ada__bar ada__bar--a" style={{ width: `${(r.a / r.max) * 100}%` }}><span>{r.fmt(r.a)}</span></div>
              <div className="ada__bar ada__bar--b" style={{ width: `${(r.b / r.max) * 100}%` }}><span>{r.fmt(r.b)}</span></div>
            </div>
          </div>
        ))}
        <p className="demo__note">grey = before · green = after. Measured with LLM evaluation and Langfuse traces.</p>
      </div>
    </div>
  )
}

export default function AdaDemo() {
  return (
    <div className="demo">
      <Graph />
      <Eval />
    </div>
  )
}
