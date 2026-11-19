import { stats } from '../data/profile'
import StatCounter from './StatCounter'
import SystemMap from './SystemMap'
import './hero.css'

export default function Hero() {
  return (
    <section id="whoami" className="section hero" aria-labelledby="whoami-title">
      <div className="hero__req mono" aria-hidden="true">
        <span className="hero__verb">GET</span> /rahil <span className="hero__status">200 OK</span>
        <span className="dim"> · flutter · backend · systems</span>
      </div>
      <h2 id="whoami-title" className="hero__title display">
        <span className="hero__line">Builds systems</span>
        <span className="hero__line dim">that scale<span className="signal">.</span></span>
      </h2>
      <div className="hero__grid">
        <p className="hero__lead">
          I'm <strong>Rahil</strong> - a <strong>Flutter</strong> and <strong>backend</strong> engineer studying CSE at ABV-IIITM Gwalior.
          I build the apps people use and the services underneath them: content-addressed storage, double-entry payment
          ledgers, real-time sync, and multi-agent research pipelines. I care about the parts that break under load -
          retries, ordering, integrity - and I measure instead of guessing.
        </p>
        <div className="hero__stats">
          {stats.map((s) => <StatCounter key={s.label} {...s} />)}
        </div>
      </div>
      <SystemMap />
    </section>
  )
}
