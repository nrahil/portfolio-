import type { SystemSlug } from '../data/profile'

/** A small, distinct visual signature per system. Each one sketches the system's core mechanism. */
export default function Glyph({ slug }: { slug: SystemSlug }) {
  switch (slug) {
    case 'blob-cloud':
      // Content-defined chunks: variable widths, deduplicated ones filled.
      return (
        <svg viewBox="0 0 160 64" className="glyph glyph--blob" aria-hidden="true">
          {[[4, 18, 0], [24, 30, 1], [56, 12, 1], [70, 26, 0], [98, 20, 1], [120, 36, 1]].map(([x, w, d], i) => (
            <rect key={i} x={x} y={22} width={w} height={20} className={d ? 'g-dedup' : 'g-new'} style={{ ['--i' as string]: i }} />
          ))}
          <text x="4" y="58" className="g-txt">sha256 → cas</text>
        </svg>
      )
    case 'paycore':
      // T-account: debit and credit legs that always balance.
      return (
        <svg viewBox="0 0 160 64" className="glyph glyph--pay" aria-hidden="true">
          <line x1="80" y1="8" x2="80" y2="52" className="g-line" />
          <line x1="20" y1="14" x2="140" y2="14" className="g-line" />
          <text x="44" y="10" className="g-txt">DR</text><text x="104" y="10" className="g-txt">CR</text>
          <rect x="28" y="22" width="44" height="7" className="g-new g-leg" />
          <rect x="88" y="34" width="44" height="7" className="g-dedup g-leg" />
          <text x="20" y="60" className="g-txt">Σ = 0</text>
        </svg>
      )
    case 'shoplon':
      // Phone fed by a stream that can be cut on logout.
      return (
        <svg viewBox="0 0 160 64" className="glyph glyph--shop" aria-hidden="true">
          <rect x="112" y="4" width="30" height="56" rx="5" className="g-line" />
          <path d="M4 32 H106" className="g-stream" />
          <circle cx="20" cy="32" r="4" className="g-node" />
          <circle cx="60" cy="32" r="4" className="g-node" />
          <text x="4" y="18" className="g-txt">snapshots()</text>
        </svg>
      )
    case 'ada':
      // Planner fans out to parallel tracks, converges through a critic.
      return (
        <svg viewBox="0 0 160 64" className="glyph glyph--ada" aria-hidden="true">
          <path d="M14 32 L56 12 M14 32 L56 32 M14 32 L56 52 M56 12 L100 32 M56 32 L100 32 M56 52 L100 32 M100 32 L146 32" className="g-line" />
          <path d="M100 32 C112 10 134 10 146 32" className="g-loop" />
          {[[14, 32], [56, 12], [56, 32], [56, 52], [100, 32], [146, 32]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" className="g-node" style={{ ['--i' as string]: i }} />)}
        </svg>
      )
    case 'library':
      // Class boxes with inheritance.
      return (
        <svg viewBox="0 0 160 64" className="glyph glyph--lib" aria-hidden="true">
          <rect x="58" y="4" width="44" height="18" className="g-line" />
          <text x="66" y="17" className="g-txt">Item</text>
          {[10, 58, 106].map((x, i) => <rect key={x} x={x} y={42} width="44" height="16" className={i === 1 ? 'g-new' : 'g-line'} />)}
          <path d="M32 42 V32 H128 V42 M80 42 V22" className="g-line" />
        </svg>
      )
  }
}
