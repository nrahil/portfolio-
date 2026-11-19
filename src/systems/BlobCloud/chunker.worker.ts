/// <reference lib="webworker" />
import { chunk, type ChunkParams } from './chunker'

export type ChunkRequest = { id: number; buffer: ArrayBuffer; params: ChunkParams }
export type HashedChunk = { offset: number; length: number; hash: string }
export type ChunkResponse = { id: number; chunks: HashedChunk[]; ms: number }

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

self.onmessage = async (e: MessageEvent<ChunkRequest>) => {
  const t0 = performance.now()
  const { id, buffer, params } = e.data
  const data = new Uint8Array(buffer)
  const spans = chunk(data, params)
  const chunks: HashedChunk[] = []
  for (const s of spans) {
    const digest = await crypto.subtle.digest('SHA-256', data.subarray(s.offset, s.offset + s.length))
    chunks.push({ ...s, hash: hex(digest) })
  }
  const res: ChunkResponse = { id, chunks, ms: performance.now() - t0 }
  ;(self as unknown as Worker).postMessage(res)
}
