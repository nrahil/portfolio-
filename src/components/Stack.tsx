import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { skillLayers, nodeLabels } from '../data/profile'
import { withTransition, scrollToSection } from '../lib/ui'
import SectionHeading from './SectionHeading'
import './stack.css'

const SYSTEM_IDS = new Set(['blob-cloud', 'paycore', 'shoplon', 'ada', 'library'])
const ALL_NODES = Object.keys(nodeLabels)

/** Skills as a dependency graph: selecting a skill resolves to the systems/roles that actually use it. */
export default function Stack() {
  const [sel, setSel] = useState('Redis')
  const navigate = useNavigate()

  // The terminal's `stack --filter=x` drives this selection too.
  useEffect(() => {
    const on = (e: Event) => setSel((e as CustomEvent<string>).detail)
    window.addEventListener('select-skill', on)
    return () => window.removeEventListener('select-skill', on)
  }, [])

  const skill = skillLayers.flatMap((l) => l.skills).find((s) => s.name === sel)
  const used = new Set(skill?.usedIn ?? [])

  const go = (id: string) => {
    if (SYSTEM_IDS.has(id)) withTransition(() => navigate(`/systems/${id}`))
    else { window.dispatchEvent(new CustomEvent('expand-role', { detail: id })); scrollToSection('experience') }
  }

  return (
    <section id="stack" className="section" aria-labelledby="stack-title">
      <SectionHeading
        index="04"
        id="stack"
        meta={`${skillLayers.reduce((a, l) => a + l.skills.length, 0)} deps · ${skillLayers.length} layers`}
        line1="The stack,"
        line2="resolved to evidence"
        lead="Pick any dependency - it resolves to the systems and roles where I actually used it. Unlinked ones are tools I've worked with outside the featured systems."
      />
      <div className="stk">
        <div className="stk__layers">
          {skillLayers.map((l) => (
            <div className="stk__layer" key={l.layer}>
              <span className="stk__lname mono">{l.layer}</span>
              <div className="stk__skills" role="group" aria-label={l.layer}>
                {l.skills.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    className={`stk__skill${s.name === sel ? ' is-sel' : ''}${s.usedIn.length ? '' : ' is-tool'}`}
                    aria-pressed={s.name === sel}
                    onClick={() => setSel(s.name)}
                    onMouseEnter={() => setSel(s.name)}
                  >
                    {s.name}
                    {s.usedIn.length > 0 && <sup>{s.usedIn.length}</sup>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="stk__resolve panel" aria-live="polite">
          <div className="panel__head"><span>$ resolve {sel.toLowerCase().replace(/\s+/g, '-')}</span><span>{used.size} hit{used.size === 1 ? '' : 's'}</span></div>
          <div className="stk__tree mono">
            <div className="stk__root">{sel}</div>
            {ALL_NODES.map((id) => (
              <button key={id} type="button" className={`stk__dep${used.has(id) ? ' is-hit' : ''}`} onClick={() => go(id)} disabled={!used.has(id)} tabIndex={used.has(id) ? 0 : -1}>
                <span className="stk__branch" aria-hidden="true">{used.has(id) ? '├──' : '│  '}</span>
                <span>{nodeLabels[id]}</span>
                <span className="stk__kind">{SYSTEM_IDS.has(id) ? 'system' : 'role'}</span>
              </button>
            ))}
            {used.size === 0 && <p className="stk__none">└── toolbox - used outside the featured systems</p>}
          </div>
        </aside>
      </div>
    </section>
  )
}
