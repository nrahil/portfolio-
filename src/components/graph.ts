import { skillLayers, nodeLabels } from '../data/profile'

export type GraphNode = { id: string; label: string; kind: 'system' | 'role'; x: number; y: number }
export type GraphEdge = { a: string; b: string; shared: string[] }

// Hand-placed layout (viewBox 720 × 400). Systems are squares, roles are diamonds.
export const NODES: GraphNode[] = [
  { id: 'blob-cloud', label: nodeLabels['blob-cloud'], kind: 'system', x: 150, y: 110 },
  { id: 'paycore', label: nodeLabels.paycore, kind: 'system', x: 370, y: 64 },
  { id: 'ada', label: nodeLabels.ada, kind: 'system', x: 590, y: 120 },
  { id: 'library', label: nodeLabels.library, kind: 'system', x: 330, y: 236 },
  { id: 'shoplon', label: nodeLabels.shoplon, kind: 'system', x: 130, y: 316 },
  { id: 'coinsanchay', label: nodeLabels.coinsanchay, kind: 'role', x: 450, y: 340 },
  { id: 'worldquant', label: nodeLabels.worldquant, kind: 'role', x: 630, y: 300 },
]

/** Edges come from real data: two nodes connect if they share at least one skill in profile.ts. */
export const EDGES: GraphEdge[] = (() => {
  const uses: Record<string, Set<string>> = {}
  for (const l of skillLayers) for (const s of l.skills) for (const u of s.usedIn) (uses[u] ??= new Set()).add(s.name)
  const out: GraphEdge[] = []
  for (let i = 0; i < NODES.length; i++) for (let j = i + 1; j < NODES.length; j++) {
    const a = NODES[i].id, b = NODES[j].id
    const shared = [...(uses[a] ?? [])].filter((x) => uses[b]?.has(x))
    if (shared.length) out.push({ a, b, shared })
  }
  return out
})()

export const nodeById = (id: string) => NODES.find((n) => n.id === id)!

/** Quadratic curve between two nodes, bowed perpendicular to the line. */
export function edgePath(e: GraphEdge, bow = 0.12) {
  const p = nodeById(e.a), q = nodeById(e.b)
  const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2
  const dx = q.x - p.x, dy = q.y - p.y
  const cx = mx - dy * bow, cy = my + dx * bow
  return `M${p.x},${p.y} Q${cx},${cy} ${q.x},${q.y}`
}
