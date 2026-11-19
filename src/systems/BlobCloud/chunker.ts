// FastCDC-style content-defined chunking (gear rolling hash + normalized chunking).
// Same algorithm family Blob-Cloud uses in the browser; the window is scaled down
// in the demo so small inputs still produce several chunks.

export type ChunkParams = { min: number; avg: number; max: number }
export type ChunkSpan = { offset: number; length: number }

// Deterministic 256-entry gear table (xorshift32 seeded), so boundaries are stable across runs.
export const GEAR: Uint32Array = (() => {
  const t = new Uint32Array(256)
  let x = 0x9e3779b9
  for (let i = 0; i < 256; i++) {
    x ^= x << 13; x >>>= 0
    x ^= x >>> 17
    x ^= x << 5; x >>>= 0
    t[i] = x
  }
  return t
})()

function maskWithBits(bits: number): number {
  // Use the top `bits` bits - the gear hash shifts left, so high bits depend on the most recent bytes.
  const b = Math.max(1, Math.min(31, bits))
  return (((1 << b) - 1) << (32 - b)) >>> 0
}

/** Choose a chunk window that yields roughly `target` chunks for an input of `size` bytes. */
export function paramsFor(size: number, target = 64): ChunkParams {
  let avg = 64
  while (avg * target < size && avg < 8 * 1024 * 1024) avg *= 2
  return { min: Math.max(16, avg / 4), avg, max: avg * 4 }
}

export function chunk(data: Uint8Array, p: ChunkParams): ChunkSpan[] {
  const out: ChunkSpan[] = []
  const bits = Math.round(Math.log2(p.avg))
  const maskS = maskWithBits(bits + 1) // stricter before avg → fewer tiny chunks
  const maskL = maskWithBits(bits - 1) // looser after avg → fewer giant chunks
  let start = 0
  const n = data.length
  while (start < n) {
    const remaining = n - start
    if (remaining <= p.min) {
      out.push({ offset: start, length: remaining })
      break
    }
    const end = Math.min(n, start + p.max)
    const normal = Math.min(end, start + p.avg)
    let h = 0
    let i = start + p.min
    let cut = end
    for (; i < normal; i++) {
      h = ((h << 1) + GEAR[data[i]]) >>> 0
      if ((h & maskS) === 0) { cut = i + 1; break }
    }
    if (cut === end && i >= normal) {
      for (; i < end; i++) {
        h = ((h << 1) + GEAR[data[i]]) >>> 0
        if ((h & maskL) === 0) { cut = i + 1; break }
      }
    }
    out.push({ offset: start, length: cut - start })
    start = cut
  }
  return out
}

/** AIMD controller used by Blob-Cloud's uploader: +1 stream on success, halve on failure, bounded 1..8. */
export function aimdStep(current: number, success: boolean, min = 1, max = 8): number {
  if (success) return Math.min(max, current + 1)
  return Math.max(min, Math.floor(current / 2))
}
