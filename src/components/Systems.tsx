import { Link, useMatch, useNavigate } from 'react-router-dom'
import { systems } from '../data/profile'
import { withTransition } from '../lib/ui'
import SectionHeading from './SectionHeading'
import Glyph from './Glyph'
import './systems.css'

export default function Systems() {
  const navigate = useNavigate()
  // Only one element may own a view-transition-name: while a case study is open, its title owns it.
  const openSlug = useMatch('/systems/:slug')?.params.slug
  const primary = systems.slice(0, 3)
  const secondary = systems.slice(3)

  const open = (e: React.MouseEvent, slug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    withTransition(() => navigate(`/systems/${slug}`))
  }

  const Row = ({ s }: { s: (typeof systems)[number] }) => (
    <li className={`sys sys--${s.slug}`}>
      <Link to={`/systems/${s.slug}`} className="sys__link" onClick={(e) => open(e, s.slug)} data-cursor="open">
        <span className="sys__idx mono">{s.index}</span>
        <span className="sys__main">
          <span className="sys__name display" style={{ viewTransitionName: openSlug === s.slug ? 'none' : `sys-${s.slug}` } as React.CSSProperties}>{s.name}</span>
          <span className="sys__kind mono">{s.kind}</span>
        </span>
        <span className="sys__line">{s.oneLiner}</span>
        <span className="sys__glyph"><Glyph slug={s.slug} /></span>
        <span className="sys__metric">
          <b>{s.results[0].value}</b>
          <span>{s.results[0].label}</span>
        </span>
        <span className="sys__go mono" aria-hidden="true">open ↗</span>
      </Link>
    </li>
  )

  return (
    <section id="systems" className="section" aria-labelledby="systems-title">
      <SectionHeading
        index="03"
        id="systems"
        meta="5 systems · each one runnable"
        line1="Systems I've"
        line2="designed & built"
        lead="Each system opens into a case study with a working model of how it behaves - chunk real bytes, move money through a ledger, cut a stream, step through an agent graph."
      />
      <ol className="sys-list" aria-label="Featured systems">
        {primary.map((s) => <Row key={s.slug} s={s} />)}
      </ol>
      <div className="sys-sub mono"><span>also built</span><span className="sh__rule" /></div>
      <ol className="sys-list sys-list--secondary" aria-label="More systems">
        {secondary.map((s) => <Row key={s.slug} s={s} />)}
      </ol>
    </section>
  )
}
