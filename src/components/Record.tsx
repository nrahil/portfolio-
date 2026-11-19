import { record, education } from '../data/profile'
import SectionHeading from './SectionHeading'
import './record.css'

export default function Record() {
  return (
    <section id="record" className="section" aria-labelledby="record-title">
      <SectionHeading index="05" id="record" meta="tail -f achievements.log" line1="Track" line2="record" />
      <div className="log panel" role="log" aria-label="Achievements and leadership">
        <div className="panel__head"><span>achievements.log</span><span>{record.length} entries</span></div>
        <ol>
          {record.map((r, i) => (
            <li key={r.key} className="log__line" style={{ ['--i' as string]: i }}>
              <span className="log__n">{String(i + 1).padStart(2, '0')}</span>
              <span className={`log__lvl log__lvl--${r.level.toLowerCase()}`}>{r.level}</span>
              <span className="log__key">{r.key}</span>
              <span className="log__msg">
                {r.href ? <a className="link-u" href={r.href} target="_blank" rel="noreferrer">{r.msg}</a> : r.msg}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="edu">
        <div>
          <span className="label">education</span>
          <p className="edu__school">{education.school}</p>
          <p className="edu__deg mono">{education.degree} · CGPA {education.cgpa} · Aug 2023 - Jun 2027</p>
        </div>
        <div>
          <span className="label">coursework</span>
          <ul className="edu__cw">{education.coursework.map((c) => <li key={c} className="chip">{c}</li>)}</ul>
        </div>
      </div>
    </section>
  )
}
