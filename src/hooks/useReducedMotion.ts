import { useEffect, useState } from 'react'

const q = '(prefers-reduced-motion: reduce)'
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia(q).matches

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setReduced(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return reduced
}
