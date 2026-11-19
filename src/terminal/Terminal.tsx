import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { identity, systems, experience, education, record, sections } from '../data/profile'
import { parse, resolveSystem, resolveSection, filterStack, complete } from './parser'
import { withTransition, scrollToSection, setTheme, getTheme, ym } from '../lib/ui'
import './terminal.css'

type Line = { id: number; node: ReactNode }
let lid = 0

const HELP: [string, string][] = [
  ['help', 'list commands'],
  ['whoami', 'who is this'],
  ['ls [systems|experience|stack]', 'list things'],
  ['open <system>', 'open a case study - e.g. open paycore'],
  ['goto <section>', 'scroll to a section - e.g. goto stack'],
  ['cat <about|education|record>', 'print a file'],
  ['stack --filter=<name>', 'which systems use a technology'],
  ['contact [--copy]', 'how to reach me (copy email)'],
  ['resume', 'download my resume (PDF)'],
  ['github', 'open my GitHub'],
  ['theme [dark|light]', 'switch theme'],
  ['clear · exit', 'clear screen · close terminal'],
]

export default function Terminal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [lines, setLines] = useState<Line[]>([])
  const [value, setValue] = useState('')
  const [hist, setHist] = useState<string[]>([])
  const [hi, setHi] = useState(-1)
  const [hint, setHint] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<Element | null>(null)

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement
      if (!lines.length) print(<span className="dim">rahil@trace:~ - type <b className="signal">help</b> to see commands, <span className="kbd">Tab</span> to complete, <span className="kbd">↑</span> for history.</span>)
      requestAnimationFrame(() => inputRef.current?.focus())
    } else if (lastFocus.current instanceof HTMLElement) lastFocus.current.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight }) }, [lines])

  function print(...nodes: ReactNode[]) {
    setLines((l) => [...l, ...nodes.map((node) => ({ id: ++lid, node }))])
  }

  function run(raw: string) {
    const input = raw.trim()
    print(<span><span className="t-prompt">rahil@trace:~$</span> {input}</span>)
    if (!input) return
    setHist((h) => [...h.filter((x) => x !== input), input])
    const { cmd, args, flags } = parse(input)
    const arg = args.join(' ')

    switch (cmd) {
      case 'help':
        print(<table className="t-table"><tbody>{HELP.map(([c, d]) => <tr key={c}><td className="signal">{c}</td><td className="dim">{d}</td></tr>)}</tbody></table>)
        return
      case 'whoami':
        print(<span>{identity.name} - {identity.role}. {education.degree} @ {education.shortSchool} ('27). Builds mobile apps and the backends under them.</span>)
        return
      case 'ls': {
        const what = arg || 'all'
        if (what === 'systems' || what === 'all')
          print(...systems.map((s) => <span key={s.slug}><span className="signal">{s.index}</span>  {s.slug.padEnd(12, ' ')} <span className="dim">{s.kind}</span></span>))
        if (what === 'experience' || what === 'all')
          print(...experience.map((x) => <span key={x.id}><span className="ok">role</span>  {x.org} - {x.role} <span className="dim">({ym(x.from)} → {ym(x.to)})</span></span>))
        if (what === 'stack') print(<span className="dim">use <b>stack --filter=&lt;name&gt;</b>, or <b>goto stack</b></span>)
        if (what === 'all') print(<span className="dim">sections: {sections.map((s) => s.id).join('  ')}</span>)
        if (!['systems', 'experience', 'stack', 'all'].includes(what)) print(<span className="warn">ls: no such listing: {what}</span>)
        return
      }
      case 'open':
      case 'cd':
      case 'goto': {
        const sys = cmd === 'open' ? resolveSystem(arg) : null
        const sec = resolveSection(arg)
        if (sys) {
          print(<span className="ok">→ opening /systems/{sys}</span>)
          onClose()
          withTransition(() => navigate(`/systems/${sys}`))
        } else if (sec) {
          print(<span className="ok">→ /{sec}</span>)
          onClose()
          navigate('/')
          setTimeout(() => scrollToSection(sec), 60)
        } else {
          const alt = resolveSystem(arg)
          print(<span className="warn">{cmd}: not found: {arg || '(nothing)'}{alt ? ` - try: open ${alt}` : ''}</span>)
        }
        return
      }
      case 'cat':
        if (/^about/.test(arg)) print(<span>I build Flutter apps and the services underneath them - storage, payments, real-time sync, AI pipelines. I care about what breaks under load: retries, ordering, integrity.</span>)
        else if (/^edu/.test(arg)) print(<span>{education.school}<br /><span className="dim">{education.degree} · CGPA {education.cgpa} · Aug 2023 → Jun 2027</span></span>)
        else if (/^rec/.test(arg)) print(...record.map((r) => <span key={r.key}><span className={r.level === 'INFO' ? 'ok' : 'warn'}>[{r.level}]</span> {r.key}: {r.msg}</span>))
        else print(<span className="warn">cat: {arg || '(nothing)'}: no such file - try about, education, record</span>)
        return
      case 'stack': {
        const q = typeof flags.filter === 'string' ? flags.filter : arg
        if (!q) { print(<span className="dim">usage: stack --filter=redis</span>); return }
        const hits = filterStack(q)
        if (!hits.length) { print(<span className="warn">stack: nothing matches “{q}”</span>); return }
        print(...hits.map((h) => <span key={h.name}><span className="signal">{h.name}</span> <span className="dim">[{h.layer}]</span> → {h.usedIn.length ? h.usedIn.join(', ') : <span className="dim">toolbox</span>}</span>))
        window.dispatchEvent(new CustomEvent('select-skill', { detail: hits[0].name }))
        return
      }
      case 'contact':
        print(
          <span>email    <a className="link-u" href={`mailto:${identity.email}`}>{identity.email}</a></span>,
          <span>github   <a className="link-u" href={identity.links.github} target="_blank" rel="noreferrer">{identity.links.github}</a></span>,
          <span>linkedin <a className="link-u" href={identity.links.linkedin} target="_blank" rel="noreferrer">{identity.links.linkedin}</a></span>,
        )
        if (flags.copy) navigator.clipboard?.writeText(identity.email).then(() => print(<span className="ok">✓ email copied to clipboard</span>), () => print(<span className="warn">clipboard unavailable</span>))
        return
      case 'resume': {
        const a = document.createElement('a')
        a.href = identity.resume; a.download = 'Netipattu_Rahil_Resume.pdf'; a.click()
        print(<span className="ok">↓ downloading Netipattu_Rahil_Resume.pdf</span>)
        return
      }
      case 'github':
        window.open(identity.links.github, '_blank', 'noopener')
        print(<span className="ok">↗ {identity.links.github}</span>)
        return
      case 'theme': {
        const t = arg === 'light' || arg === 'dark' ? arg : getTheme() === 'dark' ? 'light' : 'dark'
        setTheme(t)
        print(<span className="ok">theme → {t}</span>)
        return
      }
      case 'clear':
        setLines([])
        return
      case 'exit':
      case 'q':
        onClose()
        return
      case 'sudo':
        print(<span className="warn">permission denied - but I'm happy to talk: contact</span>)
        return
      default: {
        // Fuzzy fallbacks make it usable as a launcher.
        const sys = resolveSystem(input)
        const sec = resolveSection(input)
        if (sys) return run(`open ${sys}`)
        if (sec) return run(`goto ${sec}`)
        print(<span className="warn">command not found: {cmd} - type help</span>)
      }
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { run(value); setValue(''); setHi(-1); setHint([]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'Tab') {
      e.preventDefault()
      const c = complete(value)
      if (c.length === 1) { setValue(c[0] + ' '); setHint([]) }
      else setHint(c)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!hist.length) return
      const n = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1)
      setHi(n); setValue(hist[n])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (hi < 0) return
      const n = hi + 1
      if (n >= hist.length) { setHi(-1); setValue('') } else { setHi(n); setValue(hist[n]) }
    } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setLines([]) }
  }

  return (
    <div className={`term${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Terminal" aria-hidden={!open} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="term__win">
        <div className="term__bar mono">
          <span>rahil@trace - zsh</span>
          <span className="term__chips">
            {['help', 'ls', 'open paycore', 'stack --filter=redis', 'contact'].map((c) => (
              <button key={c} type="button" tabIndex={open ? 0 : -1} onClick={() => { run(c); inputRef.current?.focus() }}>{c}</button>
            ))}
          </span>
          <button type="button" className="term__close" onClick={onClose} tabIndex={open ? 0 : -1} aria-label="Close terminal">esc ✕</button>
        </div>
        <div className="term__body mono" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
          {lines.map((l) => <div key={l.id} className="term__line">{l.node}</div>)}
          {hint.length > 1 && <div className="term__line dim">{hint.join('   ')}</div>}
          <label className="term__input">
            <span className="t-prompt">rahil@trace:~$</span>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Terminal command"
              tabIndex={open ? 0 : -1}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
