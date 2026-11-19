import { useState } from 'react'
import { identity } from '../data/profile'
import './contact.css'

export default function Contact({ onTerminal }: { onTerminal: () => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(identity.email); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { location.href = `mailto:${identity.email}` }
  }
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="sh__meta"><span className="sh__id">span 06</span><span>/contact</span><span className="sh__rule" aria-hidden="true" /><span className="ok">status=200 · trace complete</span></div>
      <h2 id="contact-title" className="contact__title display">
        Let's build
        <span className="dim">something that scales<span className="signal">.</span></span>
      </h2>
      <p className="contact__lead">Open to software engineering internships and new-grad roles - backend, distributed systems, Flutter. The fastest way to reach me is email.</p>

      <div className="contact__mail">
        <a href={`mailto:${identity.email}`} className="contact__addr" data-cursor="mail">{identity.email}</a>
        <button type="button" className="btn" onClick={copy} aria-live="polite">{copied ? '✓ copied' : 'copy'}</button>
      </div>

      <ul className="contact__links">
        <li><a href={identity.links.github} target="_blank" rel="noreferrer"><span className="mono">github</span><span>nrahil</span><i aria-hidden="true">↗</i></a></li>
        <li><a href={identity.links.linkedin} target="_blank" rel="noreferrer"><span className="mono">linkedin</span><span>netipattu-rahil</span><i aria-hidden="true">↗</i></a></li>
        <li><a href={identity.links.leetcode} target="_blank" rel="noreferrer"><span className="mono">leetcode</span><span>nrahil · Knight</span><i aria-hidden="true">↗</i></a></li>
        <li><a href={identity.resume} download><span className="mono">resume</span><span>Netipattu_Rahil_Resume.pdf</span><i aria-hidden="true">↓</i></a></li>
      </ul>

      <footer className="foot mono">
        <span>© {new Date().getFullYear()} Netipattu Rahil</span>
        <span>hand-built · React + TypeScript · no templates</span>
        <button type="button" className="foot__term" onClick={onTerminal}>press <span className="kbd">`</span> for terminal</button>
      </footer>
    </section>
  )
}
