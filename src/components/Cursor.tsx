import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * A small crosshair that trails the native pointer (which stays visible) and shows a
 * label over elements that declare `data-cursor`. Fine pointers only; off for reduced motion.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return
    const el = ref.current!
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0
    const loop = () => {
      x += (tx - x) * 0.25; y += (ty - y) * 0.25
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0
    }
    const move = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY
      const t = (e.target as Element | null)?.closest?.('[data-cursor]')
      const label = t?.getAttribute('data-cursor') ?? ''
      const lbl = el.firstElementChild as HTMLElement
      if (lbl.textContent !== label) lbl.textContent = label
      el.classList.toggle('is-on', !!label)
      el.style.opacity = '1'
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const leave = () => { el.style.opacity = '0' }
    const scroll = () => el.classList.remove('is-on') // content moved under the pointer; label is stale
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf) }
  }, [reduced])

  if (reduced) return null
  return <div ref={ref} className="cursor" aria-hidden="true"><span className="cursor__label" /></div>
}
