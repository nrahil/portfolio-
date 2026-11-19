import { useEffect, useRef, useState } from 'react'
import { useMatch } from 'react-router-dom'
import ServiceCard from './components/ServiceCard'
import SpanRail from './components/SpanRail'
import Hero from './components/Hero'
import Experience from './components/Experience'
import Systems from './components/Systems'
import Stack from './components/Stack'
import Record from './components/Record'
import Contact from './components/Contact'
import Terminal from './terminal/Terminal'
import Cursor from './components/Cursor'
import CaseStudy from './systems/CaseStudy'
import { systems } from './data/profile'
import './components/layout.css'

export default function App() {
  const match = useMatch('/systems/:slug')
  const slug = match?.params.slug
  const system = systems.find((s) => s.slug === slug)
  const [termOpen, setTermOpen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  // Background is inert while a case study is open (focus can't wander behind the dialog).
  useEffect(() => {
    const el = shellRef.current as (HTMLDivElement & { inert: boolean }) | null
    if (el) el.inert = !!system
  }, [system])

  // Global shortcut: ` or Ctrl/⌘+K toggles the terminal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setTermOpen((o) => !o); return }
      if (e.key === '`' && !typing) { e.preventDefault(); setTermOpen((o) => !o) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Initial hash → section.
  useEffect(() => {
    const id = location.hash.slice(1)
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="shell" ref={shellRef}>
        <ServiceCard onTerminal={() => setTermOpen(true)} />
        <main id="main" className="content" tabIndex={-1}>
          <Hero />
          <Experience />
          <Systems />
          <Stack />
          <Record />
          <Contact onTerminal={() => setTermOpen(true)} />
        </main>
        <SpanRail />
      </div>
      {system && <CaseStudy key={system.slug} system={system} />}
      <Terminal open={termOpen} onClose={() => setTermOpen(false)} />
      <Cursor />
    </>
  )
}
