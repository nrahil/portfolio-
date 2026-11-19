import { useState } from 'react'
import './library.css'

type C = { id: string; name: string; st?: string; x: number; y: number; w?: number }
const W = 128, H = 40
const CLASSES: C[] = [
  { id: 'facade', name: 'LibraryService', st: 'facade', x: 346, y: 14, w: 150 },
  { id: 'user', name: 'User', st: 'abstract', x: 40, y: 110 },
  { id: 'admin', name: 'Admin', x: 10, y: 210, w: 90 },
  { id: 'student', name: 'Student', x: 110, y: 210, w: 90 },
  { id: 'repo', name: 'Repository<T>', st: 'interface', x: 220, y: 110, w: 140 },
  { id: 'factory', name: 'ItemFactory', st: 'factory', x: 400, y: 110 },
  { id: 'pricing', name: 'PricingStrategy', st: 'strategy', x: 560, y: 110, w: 150 },
  { id: 'item', name: 'Item', st: 'abstract', x: 400, y: 210 },
  { id: 'book', name: 'Book', x: 300, y: 310, w: 90 },
  { id: 'dvd', name: 'DVD', x: 400, y: 310, w: 90 },
  { id: 'mag', name: 'Magazine', x: 500, y: 310, w: 100 },
  { id: 'state', name: 'ItemState', st: 'state', x: 590, y: 210 },
  { id: 'bus', name: 'EventBus', st: 'singleton', x: 740, y: 110 },
  { id: 'alert', name: 'AlertListener', st: 'observer', x: 740, y: 210, w: 140 },
]
const cx = (c: C) => c.x + (c.w ?? W) / 2
const byId = (id: string) => CLASSES.find((c) => c.id === id)!
// [from, to, kind] - 'inh' = inheritance (child → parent), 'use' = dependency
const LINKS: [string, string, 'inh' | 'use'][] = [
  ['admin', 'user', 'inh'], ['student', 'user', 'inh'],
  ['book', 'item', 'inh'], ['dvd', 'item', 'inh'], ['mag', 'item', 'inh'],
  ['facade', 'repo', 'use'], ['facade', 'factory', 'use'], ['facade', 'pricing', 'use'], ['facade', 'bus', 'use'],
  ['factory', 'item', 'use'], ['item', 'state', 'use'], ['bus', 'alert', 'use'], ['facade', 'user', 'use'],
]

const PATTERNS: { k: string; group: 'GoF' | 'SOLID' | 'Arch'; on: string[]; why: string }[] = [
  { k: 'Facade', group: 'Arch', on: ['facade'], why: 'One service layer hides repositories, factory, pricing and events from the console UI.' },
  { k: 'Repository', group: 'Arch', on: ['repo', 'facade'], why: 'A generic Repository<T> decouples business logic from storage - backends swap without touching services.' },
  { k: 'Strategy', group: 'Arch', on: ['pricing', 'facade'], why: 'Pricing is a pluggable strategy rather than conditionals inside services.' },
  { k: 'Factory', group: 'GoF', on: ['factory', 'item', 'book', 'dvd', 'mag'], why: 'Polymorphic item creation - callers never construct Book/DVD/Magazine directly.' },
  { k: 'Singleton', group: 'GoF', on: ['bus'], why: 'A single global event bus.' },
  { k: 'Observer', group: 'GoF', on: ['bus', 'alert'], why: 'Event-driven notifications, e.g. low-balance alerts, subscribe to the bus.' },
  { k: 'State', group: 'GoF', on: ['item', 'state'], why: 'Item lifecycle (issue / return) is modelled as state objects, not flags.' },
  { k: 'Open/Closed', group: 'SOLID', on: ['dvd', 'mag', 'alert'], why: 'DVD, Magazine and low-balance alerts were added as extensions, with minimal edits to existing classes.' },
  { k: 'Liskov', group: 'SOLID', on: ['book', 'dvd', 'mag', 'item'], why: 'Every item type is substitutable wherever an Item is expected.' },
  { k: 'Dependency inversion', group: 'SOLID', on: ['facade', 'repo', 'pricing'], why: 'Services depend on abstractions, injected at construction.' },
]

export default function LibraryDemo() {
  const [sel, setSel] = useState(PATTERNS[3])
  const on = new Set(sel.on)
  return (
    <div className="panel lib">
      <div className="panel__head"><span>conceptual class map · C++</span><span>hover a pattern</span></div>
      <div className="lib__chips" role="group" aria-label="Patterns and principles">
        {(['GoF', 'Arch', 'SOLID'] as const).map((g) => (
          <div key={g} className="lib__group">
            <span className="demo__note">{g === 'Arch' ? 'structure' : g}</span>
            {PATTERNS.filter((p) => p.group === g).map((p) => (
              <button key={p.k} type="button" className={`lib__chip${sel.k === p.k ? ' is-sel' : ''}`} aria-pressed={sel.k === p.k} onMouseEnter={() => setSel(p)} onFocus={() => setSel(p)} onClick={() => setSel(p)}>{p.k}</button>
            ))}
          </div>
        ))}
      </div>
      <div className="lib__wrap">
        <svg viewBox="0 0 900 370" className="lib__svg" role="img" aria-label={`Class map highlighting ${sel.k}: ${sel.on.map((id) => byId(id).name).join(', ')}`}>
          <defs>
            <marker id="tri" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="lib__tri" /></marker>
          </defs>
          {LINKS.map(([a, b, k]) => {
            const A = byId(a), B = byId(b)
            const down = A.y < B.y
            const y1 = down ? A.y + H : A.y, y2 = down ? B.y : B.y + H
            const hot = on.has(a) && on.has(b)
            return <path key={a + b} d={`M${cx(A)},${y1} C${cx(A)},${(y1 + y2) / 2} ${cx(B)},${(y1 + y2) / 2} ${cx(B)},${y2}`} className={`lib__link lib__link--${k}${hot ? ' is-on' : ''}`} markerEnd={k === 'inh' ? 'url(#tri)' : undefined} />
          })}
          {CLASSES.map((c) => (
            <g key={c.id} className={`lib__cls${on.has(c.id) ? ' is-on' : ''}`} transform={`translate(${c.x} ${c.y})`}>
              <rect width={c.w ?? W} height={H} />
              {c.st && <text x={(c.w ?? W) / 2} y="14" textAnchor="middle" className="lib__st">«{c.st}»</text>}
              <text x={(c.w ?? W) / 2} y={c.st ? 30 : 25} textAnchor="middle" className="lib__nm">{c.name}</text>
            </g>
          ))}
        </svg>
      </div>
      <p className="lib__why" aria-live="polite"><b className="mono">{sel.k}</b> - {sel.why}</p>
    </div>
  )
}
