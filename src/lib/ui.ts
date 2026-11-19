import { flushSync } from 'react-dom'
import { prefersReducedMotion } from '../hooks/useReducedMotion'

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => unknown }

/** Run a DOM-changing callback inside a View Transition when supported and motion is allowed. */
export function withTransition(fn: () => void) {
  const d = document as DocWithVT
  // flushSync makes React commit inside the callback, so the 'after' snapshot shows the new route.
  if (d.startViewTransition && !prefersReducedMotion()) d.startViewTransition(() => flushSync(fn))
  else fn()
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', id === 'whoami' ? '/' : `/#${id}`)
  return true
}

export type Theme = 'dark' | 'light'
export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}
export function setTheme(t: Theme) {
  withTransition(() => {
    document.documentElement.dataset.theme = t
    try { localStorage.setItem('theme', t) } catch { /* storage unavailable */ }
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }))
  })
}

export const fmt = (n: number) => n.toLocaleString('en-US')
export const ym = (s: string) => {
  const [y, m] = s.split('-').map(Number)
  return new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}
