import { lazy, Suspense, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { systems, type System, type SystemSlug } from '../data/profile'
import { withTransition } from '../lib/ui'
import './case.css'

const DEMOS: Record<SystemSlug, React.LazyExoticComponent<() => JSX.Element>> = {
  'blob-cloud': lazy(() => import('./BlobCloud/BlobCloudDemo')),
  paycore: lazy(() => import('./PayCore/PayCoreDemo')),
  shoplon: lazy(() => import('./ShopLon/ShopLonDemo')),
  ada: lazy(() => import('./Ada/AdaDemo')),
  library: lazy(() => import('./LibraryMS/LibraryDemo')),
}

const DEMO_TITLE: Record<SystemSlug, string> = {
  'blob-cloud': 'Chunk it yourself',
  paycore: 'Run a payment',
  shoplon: 'Stream lifecycle',
  ada: 'Walk the research graph',
  library: 'Pattern map',
}

export default function CaseStudy({ system: s }: { system: System }) {
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const i = systems.findIndex((x) => x.slug === s.slug)
  const prev = systems[(i - 1 + systems.length) % systems.length]
  const next = systems[(i + 1) % systems.length]
  const Demo = DEMOS[s.slug]

  const close = () => withTransition(() => navigate('/'))

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    headingRef.current?.focus({ preventScroll: true })
    ref.current?.scrollTo({ top: 0 })
    document.title = `${s.name} - Netipattu Rahil`
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.term.is-open')) close() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      document.title = 'Netipattu Rahil - Flutter + Backend Engineer'
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.slug])

  const go = (e: React.MouseEvent, slug: string) => { e.preventDefault(); withTransition(() => navigate(`/systems/${slug}`)) }

  return (
    <div className={`case case--${s.slug}`} ref={ref} role="dialog" aria-modal="true" aria-labelledby="case-title">
      <div className="case__top mono">
        <button type="button" className="case__back" onClick={close}>← back to trace <span className="kbd">esc</span></button>
        <span className="case__crumb">GET /rahil › systems › <span className="signal">{s.slug}</span></span>
      </div>

      <header className="case__head">
        <span className="case__idx mono">system {s.index} / 0{systems.length}</span>
        <h1 id="case-title" ref={headingRef} tabIndex={-1} className="case__name display" style={{ viewTransitionName: `sys-${s.slug}` } as React.CSSProperties}>{s.name}</h1>
        <p className="case__kind mono">{s.kind}</p>
        <p className="case__one">{s.oneLiner}</p>
        <div className="case__links">
          {s.github && <a className="btn" href={s.github} target="_blank" rel="noreferrer">source ↗</a>}
          {s.live && <a className="btn btn--signal" href={s.live} target="_blank" rel="noreferrer">live ↗</a>}
        </div>
        <ul className="case__results">
          {s.results.map((r) => <li key={r.label}><b>{r.value}</b><span>{r.label}</span></li>)}
        </ul>
      </header>

      <section className="case__sec" aria-labelledby="c-problem">
        <span className="case__lbl mono">01 · problem</span>
        <div><h2 id="c-problem" className="case__h">What it solves</h2><p className="case__prose">{s.problem}</p></div>
      </section>

      <section className="case__sec case__sec--demo" aria-labelledby="c-demo">
        <span className="case__lbl mono">02 · architecture, running</span>
        <div>
          <h2 id="c-demo" className="case__h">{DEMO_TITLE[s.slug]}</h2>
          <Suspense fallback={<div className="panel case__loading mono">loading model…</div>}>
            <Demo />
          </Suspense>
        </div>
      </section>

      <section className="case__sec" aria-labelledby="c-dec">
        <span className="case__lbl mono">03 · decisions</span>
        <div>
          <h2 id="c-dec" className="case__h">Key design decisions</h2>
          <ol className="case__list">
            {s.decisions.map((d, k) => (
              <li key={d.title}><span className="mono signal">{String(k + 1).padStart(2, '0')}</span><div><h3>{d.title}</h3><p>{d.body}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="case__sec" aria-labelledby="c-ch">
        <span className="case__lbl mono">04 · challenges</span>
        <div>
          <h2 id="c-ch" className="case__h">Hard parts</h2>
          <ol className="case__list case__list--ch">
            {s.challenges.map((d) => (
              <li key={d.title}><span className="mono warn">!</span><div><h3>{d.title}</h3><p>{d.body}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="case__sec" aria-labelledby="c-stack">
        <span className="case__lbl mono">05 · stack</span>
        <div>
          <h2 id="c-stack" className="case__h">Built with</h2>
          <div className="case__stack">{s.stack.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        </div>
      </section>

      <nav className="case__nav" aria-label="Other systems">
        <Link to={`/systems/${prev.slug}`} onClick={(e) => go(e, prev.slug)}><span className="mono">← prev</span><b>{prev.name}</b></Link>
        <Link to={`/systems/${next.slug}`} onClick={(e) => go(e, next.slug)}><span className="mono">next →</span><b>{next.name}</b></Link>
      </nav>
    </div>
  )
}
