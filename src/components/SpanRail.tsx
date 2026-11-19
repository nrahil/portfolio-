import { useEffect, useRef, useState } from 'react'
import { sections } from '../data/profile'
import { useScrollSpans } from '../hooks/useScrollSpans'
import { scrollToSection } from '../lib/ui'

const ids = sections.map((s) => s.id)

/**
 * Navigation drawn as a trace waterfall (Jaeger-style): each section is a span whose bar is
 * offset and sized by where that section really sits in the page. A vertical "now" line sweeps
 * across the waterfall as you scroll, like a playhead over the trace.
 */
export default function SpanRail() {
  const { progress, active } = useScrollSpans(ids)
  const [geo, setGeo] = useState(() => ids.map((_, i) => ({ start: i / ids.length, size: 1 / ids.length })))
  const nowRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const measure = () => {
      const total = document.documentElement.scrollHeight
      setGeo(ids.map((id) => {
        const el = document.getElementById(id)
        if (!el) return { start: 0, size: 0 }
        const top = el.getBoundingClientRect().top + window.scrollY
        return { start: top / total, size: el.offsetHeight / total }
      }))
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const total = document.documentElement.scrollHeight
        const at = (window.scrollY + window.innerHeight * 0.4) / total
        if (nowRef.current) nowRef.current.style.left = `${Math.min(100, at * 100)}%`
      })
    }
    measure(); onScroll()
    const ro = new ResizeObserver(() => { measure(); onScroll() })
    ro.observe(document.body)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { ro.disconnect(); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <nav className="rail" aria-label="Sections">
      <div className="rail__head" aria-hidden="true">
        <b>GET /rahil</b>
        <span>trace · {ids.length} spans</span>
      </div>
      <div className="rail__list">
        <span className="rail__now" ref={nowRef} aria-hidden="true" />
        {sections.map((s, i) => {
          const done = progress[i] >= 0.999
          return (
            <button
              key={s.id}
              type="button"
              className={`rail__item${i === active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
              onClick={() => scrollToSection(s.id)}
              aria-current={i === active ? 'location' : undefined}
            >
              <span className="rail__label"><span>{s.label}</span><span className="rail__pct">{Math.round(progress[i] * 100)}%</span></span>
              <span className="rail__track">
                <span className="rail__span" style={{ left: `${geo[i].start * 100}%`, width: `${Math.max(geo[i].size * 100, 3)}%` }}>
                  <span className="rail__fill" style={{ transform: `scaleX(${progress[i]})` }} />
                </span>
              </span>
              <span className="rail__tip">{s.tag}</span>
            </button>
          )
        })}
      </div>
      <div className="rail__foot">
        <span>{Math.round(progress.reduce((a, p, i) => a + p * geo[i].size, 0) * 100)}% of trace read</span>
        <span>press <span className="kbd">`</span> for terminal</span>
      </div>
    </nav>
  )
}
