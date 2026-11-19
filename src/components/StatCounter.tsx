import { useEffect, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { prefersReducedMotion } from '../hooks/useReducedMotion'

type Props = { value: number; suffix?: string; decimals?: number; label: string; note?: string }

export default function StatCounter({ value, suffix = '', decimals = 0, label, note }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    if (prefersReducedMotion()) { setN(value); return }
    let raf = 0
    const t0 = performance.now()
    const dur = 1100
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      setN(value * (1 - Math.pow(1 - k, 4)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value])
  const shown = n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return (
    <div className="stat" ref={ref}>
      <div className="stat__value" aria-hidden="true">{shown}<span className="signal">{suffix}</span></div>
      <span className="sr-only">{value.toLocaleString('en-US')}{suffix}</span>
      <div className="stat__label">{label}</div>
      {note && <div className="stat__note">{note}</div>}
    </div>
  )
}
