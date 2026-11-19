import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NODES, EDGES, edgePath, nodeById } from './graph'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { withTransition, scrollToSection } from '../lib/ui'
import './hero.css'

export default function SystemMap() {
  const [focus, setFocus] = useState<string | null>(null)
  const reduced = useReducedMotion()
  const navigate = useNavigate()

  const links = useMemo(() => (focus ? EDGES.filter((e) => e.a === focus || e.b === focus) : []), [focus])
  const neighbours = useMemo(() => new Set(links.flatMap((e) => [e.a, e.b])), [links])

  const activate = (id: string) => {
    const n = nodeById(id)
    if (n.kind === 'system') withTransition(() => navigate(`/systems/${id}`))
    else {
      window.dispatchEvent(new CustomEvent('expand-role', { detail: id }))
      scrollToSection('experience')
    }
  }

  return (
    <figure className="map" aria-labelledby="map-cap">
      <div className="map__bar">
        <span>topology · 5 systems · 2 roles · {EDGES.length} shared-tech links</span>
        <span className="map__legend" aria-hidden="true"><i className="sq" />system <i className="di" />role</span>
      </div>
      <svg viewBox="0 0 720 400" className="map__svg" role="group" aria-label="Map of systems and roles connected by shared technology" onMouseLeave={() => setFocus(null)}>
        <g className="map__edges">
          {EDGES.map((e) => {
            const on = focus && (e.a === focus || e.b === focus)
            const d = edgePath(e)
            return (
              <g key={e.a + e.b} className={on ? 'is-on' : focus ? 'is-off' : ''}>
                <path d={d} id={`edge-${e.a}-${e.b}`} />
                {on && !reduced && (
                  <circle r="3.5" className="map__packet">
                    <animateMotion dur="1.6s" repeatCount="indefinite" path={d} keyPoints={e.a === focus ? '0;1' : '1;0'} keyTimes="0;1" calcMode="linear" />
                  </circle>
                )}
              </g>
            )
          })}
        </g>
        {NODES.map((n) => {
          const state = focus === n.id ? 'is-focus' : focus && neighbours.has(n.id) ? 'is-near' : focus ? 'is-off' : ''
          return (
            <g
              key={n.id}
              className={`map__node map__node--${n.kind} ${state}`}
              transform={`translate(${n.x} ${n.y})`}
              tabIndex={0}
              role="button"
              aria-label={`${n.label} - ${n.kind === 'system' ? 'open case study' : 'view role'}`}
              data-cursor={n.kind === 'system' ? 'open' : 'view'}
              onMouseEnter={() => setFocus(n.id)}
              onFocus={() => setFocus(n.id)}
              onBlur={() => setFocus(null)}
              onClick={() => activate(n.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(n.id) } }}
            >
              <rect className="map__hit" x="-60" y="-26" width="120" height="58" />
              {n.kind === 'system' ? <rect className="map__shape" x="-9" y="-9" width="18" height="18" /> : <rect className="map__shape" x="-8" y="-8" width="16" height="16" transform="rotate(45)" />}
              <text className="map__label" y="28" textAnchor="middle">{n.label}</text>
            </g>
          )
        })}
      </svg>
      <figcaption id="map-cap" className="map__readout" aria-live="polite">
        {focus ? (
          <>
            <span className="signal">{nodeById(focus).label}</span>
            {links.length ? (
              <ul>
                {links.map((e) => {
                  const other = nodeById(e.a === focus ? e.b : e.a)
                  return <li key={other.id}><span className="map__arrow">⇄ {other.label}</span> <span className="dim">{e.shared.join(' · ')}</span></li>
                })}
              </ul>
            ) : <span className="dim"> - no shared technology with the others</span>}
          </>
        ) : (
          <span className="dim">hover or tab through a node to trace shared technology · click to open it</span>
        )}
      </figcaption>
    </figure>
  )
}
