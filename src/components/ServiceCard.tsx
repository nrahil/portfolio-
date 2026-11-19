import { identity } from '../data/profile'

export default function ServiceCard({ onTerminal }: { onTerminal: () => void }) {
  return (
    <aside className="card" aria-label="Profile">
      <div className="card__top">
        <span>service.yaml</span>
        <span className="card__live"><span className="dot dot--pulse" aria-hidden="true" />healthy</span>
      </div>

      <figure className="card__photo" style={{ margin: 0 }}>
        <img src={identity.photo} alt="Portrait of Netipattu Rahil" width={720} height={1026} decoding="async" />
        <figcaption className="card__tag">replica 1/1 · gwalior</figcaption>
      </figure>

      <h1 className="card__name display">
        Netipattu<br /><span className="dim">Rahil</span>
      </h1>

      <dl className="card__spec">
        <dt>service</dt><dd>{identity.service}</dd>
        <dt>role</dt><dd>{identity.role.toLowerCase()}</dd>
        <dt>build</dt><dd>{identity.build}</dd>
        <dt>region</dt><dd>{identity.region}</dd>
        <dt>status</dt><dd className="ok">● {identity.status}</dd>
      </dl>

      <nav className="card__links" aria-label="Profiles">
        <a href={identity.links.github} target="_blank" rel="noreferrer">github<span aria-hidden="true">↗</span></a>
        <a href={identity.links.linkedin} target="_blank" rel="noreferrer">linkedin<span aria-hidden="true">↗</span></a>
        <a href={identity.links.leetcode} target="_blank" rel="noreferrer">leetcode<span aria-hidden="true">↗</span></a>
        <a href={`mailto:${identity.email}`}>email<span aria-hidden="true">→</span></a>
        <a className="card__resume" href={identity.resume} download>download resume.pdf<span aria-hidden="true">↓</span></a>
      </nav>

      <button className="card__term" onClick={onTerminal} type="button">
        <span><b>$</b> open terminal - explore by command</span>
        <span className="kbd" aria-hidden="true">`</span>
      </button>
    </aside>
  )
}
