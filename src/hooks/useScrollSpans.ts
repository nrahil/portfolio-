import { useEffect, useState } from 'react'

/**
 * For each section id, returns how much of it has been "traversed" (0..1)
 * using a read line at 40% of the viewport, plus which section is active.
 */
export function useScrollSpans(ids: readonly string[]) {
  const [state, setState] = useState<{ progress: number[]; active: number }>({ progress: ids.map(() => 0), active: 0 })
  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const line = window.innerHeight * 0.4
      let active = 0
      const progress = ids.map((id, i) => {
        const el = document.getElementById(id)
        if (!el) return 0
        const r = el.getBoundingClientRect()
        if (r.top <= line) active = i
        return Math.min(1, Math.max(0, (line - r.top) / Math.max(1, r.height)))
      })
      // At the very bottom the last section is fully done.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        active = ids.length - 1
        progress[ids.length - 1] = 1
      }
      setState((prev) => (prev.active === active && prev.progress.every((p, i) => Math.abs(p - progress[i]) < 0.005) ? prev : { progress, active }))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure) }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [ids])
  return state
}
