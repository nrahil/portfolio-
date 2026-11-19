import { systems, sections, skillLayers, type SystemSlug } from '../data/profile'

export type Parsed = { cmd: string; args: string[]; flags: Record<string, string | true> }

export function parse(input: string): Parsed {
  const tokens = input.trim().match(/"[^"]*"|'[^']*'|\S+/g) ?? []
  const clean = tokens.map((t) => t.replace(/^["']|["']$/g, ''))
  const [cmd = '', ...rest] = clean
  const args: string[] = []
  const flags: Record<string, string | true> = {}
  for (const t of rest) {
    if (t.startsWith('--')) {
      const [k, v] = t.slice(2).split('=')
      flags[k] = v ?? true
    } else if (t.startsWith('-') && t.length > 1) {
      flags[t.slice(1)] = true
    } else args.push(t)
  }
  return { cmd: cmd.toLowerCase(), args, flags }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Resolve a loose name ("pay", "blob", "Library") to a system slug. */
export function resolveSystem(q: string): SystemSlug | null {
  const n = norm(q)
  if (!n) return null
  const exact = systems.find((s) => norm(s.slug) === n || norm(s.name) === n)
  if (exact) return exact.slug
  const prefix = systems.find((s) => norm(s.slug).startsWith(n) || norm(s.name).startsWith(n))
  if (prefix) return prefix.slug
  const contains = systems.find((s) => norm(s.name).includes(n))
  return contains ? contains.slug : null
}

export function resolveSection(q: string): string | null {
  const n = norm(q)
  if (!n) return null
  const aliases: Record<string, string> = { about: 'whoami', home: 'whoami', projects: 'systems', skills: 'stack', work: 'experience', achievements: 'record', email: 'contact' }
  if (aliases[n]) return aliases[n]
  const s = sections.find((x) => x.id.startsWith(n))
  return s ? s.id : null
}

/** All skills (case-insensitive substring) and the systems/roles that use them. */
export function filterStack(q: string) {
  const n = q.toLowerCase()
  return skillLayers.flatMap((l) => l.skills.filter((s) => s.name.toLowerCase().includes(n)).map((s) => ({ ...s, layer: l.layer })))
}

export const COMMANDS = ['help', 'ls', 'open', 'cd', 'goto', 'cat', 'whoami', 'stack', 'contact', 'resume', 'theme', 'clear', 'exit', 'github'] as const

export function complete(input: string): string[] {
  const p = input.replace(/^\s+/, '')
  const parts = p.split(/\s+/)
  if (parts.length <= 1) return COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase())).map((c) => c)
  const [cmd, partial = ''] = parts
  const pool: string[] =
    cmd === 'open' ? systems.map((s) => s.slug)
    : cmd === 'goto' || cmd === 'cd' ? sections.map((s) => s.id)
    : cmd === 'ls' ? ['systems', 'experience', 'stack']
    : cmd === 'cat' ? ['about', 'education', 'record']
    : cmd === 'theme' ? ['dark', 'light']
    : []
  return pool.filter((x) => x.startsWith(partial.toLowerCase())).map((x) => `${cmd} ${x}`)
}
