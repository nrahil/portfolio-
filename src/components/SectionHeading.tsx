import type { ReactNode } from 'react'

type Props = { index: string; id: string; meta?: string; line1: string; line2: string; lead?: ReactNode }

/** Section header styled as a span in the page trace. */
export default function SectionHeading({ index, id, meta, line1, line2, lead }: Props) {
  return (
    <header className="sh">
      <div className="sh__meta">
        <span className="sh__id">span {index}</span>
        <span>/{id}</span>
        <span className="sh__rule" aria-hidden="true" />
        {meta && <span>{meta}</span>}
      </div>
      <h2 className="sh__title display" id={`${id}-title`}>
        {line1}
        <span className="dim">{line2}</span>
      </h2>
      {lead && <p className="sh__lead">{lead}</p>}
    </header>
  )
}
