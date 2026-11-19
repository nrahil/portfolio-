import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { paramsFor, aimdStep, type ChunkParams } from './chunker'
import type { ChunkResponse, HashedChunk } from './chunker.worker'
import { systems } from '../../data/profile'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import './blob.css'

// Sample document: the design notes of every system on this site (~6 KB of real text).
const SAMPLE = systems
  .map((s) => `# ${s.name}\n\n${s.problem}\n\n${s.decisions.map((d) => `## ${d.title}\n${d.body}`).join('\n\n')}`)
  .join('\n\n')

type Version = { label: string; chunks: (HashedChunk & { fresh: boolean })[]; bytes: number; ms: number; text?: string }
const fmtB = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`)

function useChunkWorker() {
  const w = useRef<Worker | null>(null)
  const pending = useRef(new Map<number, (r: ChunkResponse) => void>())
  const seq = useRef(0)
  useEffect(() => {
    const worker = new Worker(new URL('./chunker.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<ChunkResponse>) => { pending.current.get(e.data.id)?.(e.data); pending.current.delete(e.data.id) }
    w.current = worker
    return () => worker.terminate()
  }, [])
  return useCallback((buffer: ArrayBuffer, params: ChunkParams) => new Promise<ChunkResponse>((resolve) => {
    const id = ++seq.current
    pending.current.set(id, resolve)
    w.current!.postMessage({ id, buffer, params }, [buffer])
  }), [])
}

function Chunker() {
  const run = useChunkWorker()
  const [text, setText] = useState(SAMPLE)
  const [versions, setVersions] = useState<Version[]>([])
  const [busy, setBusy] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const store = useRef(new Map<string, number>()) // the "server": hash → size
  const params = useRef<ChunkParams | null>(null)

  const upload = async (buf: ArrayBuffer, label: string, srcText?: string) => {
    setBusy(true)
    params.current ??= paramsFor(buf.byteLength, 48)
    const bytes = buf.byteLength
    const res = await run(buf, params.current)
    const seenThisUpload = new Set<string>()
    const chunks = res.chunks.map((c) => {
      const fresh = !store.current.has(c.hash) && !seenThisUpload.has(c.hash)
      seenThisUpload.add(c.hash)
      return { ...c, fresh }
    })
    for (const c of chunks) store.current.set(c.hash, c.length)
    setVersions((v) => [...v, { label, chunks, bytes, ms: res.ms, text: srcText }])
    setBusy(false)
  }

  const uploadText = () => {
    const enc = new TextEncoder().encode(text)
    upload(enc.buffer.slice(0) as ArrayBuffer, `v${versions.length + 1} · notes.md`, text)
  }
  const onFile = async (f: File | undefined) => {
    if (!f) return
    if (f.size > 64 * 1048576) { alert('Pick a file under 64 MB for the in-browser demo.'); return }
    upload(await f.arrayBuffer(), `v${versions.length + 1} · ${f.name}`)
  }
  const reset = () => { store.current.clear(); params.current = null; setVersions([]); setText(SAMPLE) }

  const edits = [
    { label: 'insert a line at the top', fn: (t: string) => `> Edited: a new line inserted before everything else.\n\n${t}` },
    { label: 'change one word mid-file', fn: (t: string) => { const i = Math.floor(t.length / 2); const j = t.indexOf(' ', i); return t.slice(0, j) + ' REVISED' + t.slice(j) } },
    { label: 'append a paragraph', fn: (t: string) => `${t}\n\n## Appendix\nA paragraph appended at the end of the document.` },
  ]

  const last = versions[versions.length - 1]
  const textRef = useRef<HTMLDivElement>(null)
  // After each upload, bring the first new chunk into view inside the text pane.
  useEffect(() => {
    const box = textRef.current
    const first = box?.querySelector<HTMLElement>('.is-new')
    if (box && first && versions.length > 1) box.scrollTop = first.offsetTop - 24
  }, [versions])
  const totals = useMemo(() => {
    const logical = versions.reduce((a, v) => a + v.bytes, 0)
    const stored = [...store.current.values()].reduce((a, b) => a + b, 0)
    return { logical, stored }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions])
  const newBytes = last ? last.chunks.filter((c) => c.fresh).reduce((a, c) => a + c.length, 0) : 0

  // Text with chunk boundaries painted in, for text uploads.
  const segments = useMemo(() => {
    if (!last?.text) return null
    const enc = new TextEncoder().encode(last.text)
    const dec = new TextDecoder()
    // stream:true carries a split multi-byte character over to the next chunk instead of mangling it.
    return last.chunks.map((c) => ({ ...c, str: dec.decode(enc.subarray(c.offset, c.offset + c.length), { stream: true }) }))
  }, [last])

  return (
    <div className="panel blob-chunk">
      <div className="panel__head">
        <span>fastcdc · gear hash · sha-256 in a web worker{params.current ? ` · window ${params.current.min}/${params.current.avg}/${params.current.max} B` : ''}</span>
        <button className="btn btn--sm" onClick={reset} type="button">reset store</button>
      </div>
      <div className="blob-chunk__body">
        <div className="blob-chunk__input">
          <label className="demo__note" htmlFor="cdc-text">document (edit it between uploads)</label>
          <textarea id="cdc-text" className="input blob-chunk__ta" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <div className="demo__row">
            {edits.map((e) => <button key={e.label} type="button" className="btn btn--sm" onClick={() => setText(e.fn)}>{e.label}</button>)}
          </div>
          <div className="demo__row">
            <button type="button" className="btn btn--signal" onClick={uploadText} disabled={busy}>{busy ? 'hashing…' : `upload v${versions.length + 1}`}</button>
            <label className="btn">
              or chunk a file
              <input type="file" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            </label>
          </div>
          <p className="demo__note">Real chunking and hashing run in your browser. The window is scaled down (Blob-Cloud uses 1-8 MB) so a small document still splits into many chunks. Nothing is uploaded anywhere.</p>
        </div>

        <div className="blob-chunk__out">
          {!last ? (
            <div className="blob-empty mono">upload v1, edit the document, upload v2 -<br />only the chunks around your edit should be new.</div>
          ) : (
            <>
              <div className="blob-stats">
                <div><b>{last.chunks.length}</b><span>chunks</span></div>
                <div><b className="signal">{last.chunks.filter((c) => c.fresh).length}</b><span>new</span></div>
                <div><b className="ok">{last.chunks.filter((c) => !c.fresh).length}</b><span>dedup</span></div>
                <div><b>{fmtB(newBytes)}</b><span>sent of {fmtB(last.bytes)}</span></div>
                <div><b>{last.ms.toFixed(1)} ms</b><span>chunk + hash</span></div>
              </div>
              <div className="blob-blocks" role="img" aria-label={`${last.chunks.length} chunks, ${last.chunks.filter((c) => c.fresh).length} new`}>
                {last.chunks.map((c, i) => (
                  <span
                    key={i}
                    className={`blob-block${c.fresh ? ' is-new' : ' is-dup'}${hover === i ? ' is-hover' : ''}`}
                    style={{ flexGrow: c.length, ['--i' as string]: Math.min(i, 60) }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                ))}
              </div>
              <div className="blob-inspect mono">
                {hover !== null && last.chunks[hover] ? (
                  <>chunk #{hover} · offset {last.chunks[hover].offset} · {last.chunks[hover].length} B · sha256 <span className="signal">{last.chunks[hover].hash.slice(0, 16)}…</span> · {last.chunks[hover].fresh ? <span className="signal">uploaded</span> : <span className="ok">already stored - skipped</span>}</>
                ) : <span className="dim">hover a chunk to inspect its hash</span>}
              </div>
              {segments && (
                <div className="blob-text mono" ref={textRef} aria-label="Document with chunk boundaries">
                  {segments.map((s, i) => <span key={i} className={`${s.fresh ? 'is-new' : 'is-dup'}${hover === i ? ' is-hover' : ''}`} onMouseEnter={() => setHover(i)}>{s.str}</span>)}
                </div>
              )}
              <div className="blob-versions mono">
                {versions.map((v) => {
                  const nb = v.chunks.filter((c) => c.fresh).reduce((a, c) => a + c.length, 0)
                  return <div key={v.label}><span>{v.label}</span><span>{fmtB(v.bytes)}</span><span className={nb ? 'signal' : 'ok'}>+{fmtB(nb)} stored</span></div>
                })}
                <div className="blob-versions__total"><span>store total</span><span>{fmtB(totals.logical)} logical</span><span className="ok">{fmtB(totals.stored)} physical{totals.logical ? ` · ${(100 - (totals.stored / totals.logical) * 100).toFixed(1)}% saved` : ''}</span></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const STAGES = [
  { t: 'Browser', d: 'FastCDC + SHA-256 · Web Workers' },
  { t: 'Presigned PUT', d: 'S3 multipart · resumable' },
  { t: 'Quarantine', d: 'untrusted until verified' },
  { t: 'Verifier', d: 'streaming SHA-256 · constant memory' },
  { t: 'Promote', d: 'PG advisory lock · CAS insert' },
  { t: 'Journal', d: 'append-only change log' },
  { t: 'Fan-out', d: 'Redis Pub/Sub → WebSocket · SQS → Lambda' },
]

function Ingest() {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(-1)
  const [forged, setForged] = useState(false)
  const [msg, setMsg] = useState('send a chunk through the pipeline')
  const timer = useRef<number>()
  useEffect(() => () => clearTimeout(timer.current), [])

  const send = (forge: boolean) => {
    clearTimeout(timer.current)
    setForged(forge)
    let i = 0
    const tick = () => {
      setStep(i)
      if (forge && i === 3) { setMsg('✗ hash mismatch at verifier - forged chunk is never promoted'); return }
      if (i === STAGES.length - 1) { setMsg('✓ verified, promoted once under lock, journaled, pushed to every device'); return }
      i++
      timer.current = window.setTimeout(tick, reduced ? 0 : 420)
    }
    setMsg(forge ? 'client claims a hash that does not match its bytes…' : 'honest chunk in flight…')
    tick()
  }

  return (
    <div className="panel">
      <div className="panel__head"><span>zero-trust ingest path</span><span className="demo__row"><button type="button" className="btn btn--sm" onClick={() => send(false)}>send honest chunk</button><button type="button" className="btn btn--sm" onClick={() => send(true)}>send forged chunk</button></span></div>
      <div style={{ padding: 14 }} className="demo">
        <div className="flow">
          {STAGES.map((s, i) => {
            const cls = step < 0 ? '' : forged && i === 3 && step === 3 ? 'is-bad' : i === step ? 'is-hot' : i < step ? 'is-ok' : ''
            return <div key={s.t} className={`flow__stage ${cls}`}><b>{s.t}</b><span>{s.d}</span></div>
          })}
        </div>
        <p className={`mono blob-msg ${msg.startsWith('✗') ? 'bad' : msg.startsWith('✓') ? 'ok' : 'dim'}`} aria-live="polite">{msg}</p>
      </div>
    </div>
  )
}

function rng(seed: number) { let x = seed || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000 } }

function Aimd() {
  const [loss, setLoss] = useState(10)
  const [seed, setSeed] = useState(42)
  const series = useMemo(() => {
    const r = rng(seed * 7919 + loss)
    const out: { s: number; fail: boolean }[] = []
    let s = 1
    for (let t = 0; t < 80; t++) {
      // Each tick sends `s` parts; the round fails if any part fails.
      let fail = false
      for (let k = 0; k < s; k++) if (r() < loss / 100 / 4) fail = true
      out.push({ s, fail })
      s = aimdStep(s, !fail)
    }
    return out
  }, [loss, seed])
  const W = 640, H = 150, P = 18
  const x = (i: number) => P + (i / 79) * (W - 2 * P)
  const y = (s: number) => H - P - ((s - 1) / 7) * (H - 2 * P)
  const d = series.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.s)}${i < 79 ? ` H${x(i + 1)}` : ''}`).join(' ')
  const avg = series.reduce((a, p) => a + p.s, 0) / series.length

  return (
    <div className="panel">
      <div className="panel__head"><span>adaptive concurrency · aimd(+1 / ÷2) · bounds 1-8</span><span>avg {avg.toFixed(2)} streams</span></div>
      <div style={{ padding: 14 }} className="demo">
        <svg viewBox={`0 0 ${W} ${H}`} className="aimd" role="img" aria-label={`Parallel upload streams over 80 rounds at ${loss}% part failure, average ${avg.toFixed(1)}`}>
          {[1, 2, 4, 8].map((s) => <g key={s}><line x1={P} x2={W - P} y1={y(s)} y2={y(s)} className="aimd__grid" /><text x={2} y={y(s) + 3} className="aimd__lbl">{s}</text></g>)}
          <path d={d} className="aimd__line" />
          {series.map((p, i) => p.fail && <circle key={i} cx={x(i)} cy={y(p.s)} r="3" className="aimd__fail" />)}
        </svg>
        <div className="demo__row">
          <label className="mono demo__note" htmlFor="loss">part failure rate</label>
          <input id="loss" type="range" min={0} max={40} value={loss} onChange={(e) => setLoss(+e.target.value)} className="aimd__range" />
          <span className="mono">{loss}%</span>
          <button type="button" className="btn btn--sm" onClick={() => setSeed((s) => s + 1)}>new network</button>
        </div>
        <p className="demo__note">Simulated network; the controller is the uploader's real rule - one more stream after a clean round, half as many after a failure. Red dots are failed rounds.</p>
      </div>
    </div>
  )
}

export default function BlobCloudDemo() {
  return (
    <div className="demo">
      <Chunker />
      <Ingest />
      <Aimd />
    </div>
  )
}
