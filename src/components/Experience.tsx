import { useEffect, useState } from 'react'
import { experience, education } from '../data/profile'
import { ym } from '../lib/ui'
import SectionHeading from './SectionHeading'
import './experience.css'

const AXIS_FROM = toMonths('2023-08')
const AXIS_TO = toMonths('2027-06')
function toMonths(s: string) { const [y, m] = s.split('-').map(Number); return y * 12 + (m - 1) }
const pct = (s: string) => ((toMonths(s) - AXIS_FROM) / (AXIS_TO - AXIS_FROM)) * 100
const now = new Date()
const NOW = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const nowPct = Math.min(100, Math.max(0, pct(NOW)))
const YEARS = [2024, 2025, 2026, 2027]

const PIPE = [
  { k: 'client', t: 'Flutter app', d: '188 Dart files · reactive RTDB streams · biometric session timeouts' },
  { k: 'platform', t: 'Firebase', d: 'Auth · Realtime DB · Cloud Functions v2 · 59 backend services' },
  { k: 'scheduler', t: 'Rebalancer', d: 'cron 9 AM / 9 PM · drift > 5% · batches of 10 users · 12 h cooldown' },
  { k: 'external', t: 'Binance · CoinGecko · Razorpay', d: 'keys sealed with AES-256-CBC · atomic 1-credit gates' },
  { k: 'ai', t: 'GPT-4o / 4o-mini', d: '5-phase chain · temp 0 · 6K budget · 3-tier retry · <4MB guard' },
  { k: 'out', t: 'Users', d: 'FCM push alerts · PDFKit 5-section statements · validated JSON insights' },
]
const LOOP = ['hypothesis', 'alpha expression', 'backtest', 'Sharpe · Fitness · Turnover', 'refine']

export default function Experience() {
  const [open, setOpen] = useState<string | null>('coinsanchay')
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    const on = (e: Event) => setOpen((e as CustomEvent<string>).detail)
    window.addEventListener('expand-role', on)
    return () => window.removeEventListener('expand-role', on)
  }, [])

  const lit = hover ?? open

  return (
    <section id="experience" className="section" aria-labelledby="experience-title">
      <SectionHeading index="02" id="experience" meta="2 roles · 2025 → 2026" line1="Where I've" line2="shipped & researched" />

      <div className="tl" aria-hidden="true">
        <div className="tl__years">
          {YEARS.map((y) => <span key={y} style={{ left: `${pct(`${y}-01`)}%` }}>{y}</span>)}
        </div>
        <div className="tl__lane tl__lane--edu">
          <span className="tl__bar" style={{ left: 0, width: '100%' }}><em>{education.shortSchool} · B.Tech CSE · CGPA {education.cgpa}</em></span>
        </div>
        {experience.map((x) => (
          <div className="tl__lane" key={x.id}>
            <span className={`tl__bar${lit === x.id ? ' is-lit' : ''}`} style={{ left: `${pct(x.from)}%`, width: `${pct(x.to) - pct(x.from) + 2}%` }}>
              <em>{x.org}</em>
            </span>
          </div>
        ))}
        <span className="tl__now" style={{ left: `${nowPct}%` }}><b>now</b></span>
      </div>

      <ol className="xp">
        {experience.map((x) => {
          const isOpen = open === x.id
          return (
            <li key={x.id} className={`xp__row${isOpen ? ' is-open' : ''}`} onMouseEnter={() => setHover(x.id)} onMouseLeave={() => setHover(null)}>
              <button className="xp__head" aria-expanded={isOpen} aria-controls={`xp-${x.id}`} onClick={() => setOpen(isOpen ? null : x.id)}>
                <span className="xp__date mono">{ym(x.from)} - {ym(x.to)}</span>
                <span className="xp__org">
                  <span className="xp__orgname">{x.org}</span>
                  {x.orgNote && <span className="xp__note mono">({x.orgNote})</span>}
                </span>
                <span className="xp__role">{x.role}</span>
                <span className="xp__toggle mono" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
              <div id={`xp-${x.id}`} className="xp__body" hidden={!isOpen}>
                {x.id === 'coinsanchay' ? (
                  <div className="pipe" role="list" aria-label="CoinSanchay architecture, left to right">
                    {PIPE.map((p, i) => (
                      <div className="pipe__stage" role="listitem" key={p.k} style={{ ['--i' as string]: i }}>
                        <span className="pipe__k mono">{p.k}</span>
                        <strong>{p.t}</strong>
                        <span className="pipe__d">{p.d}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="loop" aria-label="Research loop (process, not metrics)">
                    {LOOP.map((s, i) => (
                      <span key={s} className="loop__step mono">{s}{i < LOOP.length - 1 ? <i aria-hidden="true">→</i> : <i aria-hidden="true" className="signal">↺</i>}</span>
                    ))}
                  </div>
                )}
                <ul className="xp__points">
                  {x.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <div className="xp__stack">
                  {x.stack.map((s) => <span className="chip" key={s}>{s}</span>)}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
