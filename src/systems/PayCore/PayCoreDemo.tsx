import { useEffect, useRef, useState } from 'react'
import { initialLedger, execute, relay, consumeOne, replayDlq, balances, trialBalance, ACCOUNTS, type Op, type LedgerState, type Response } from './ledger'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import './paycore.css'

const OPS: Op[] = ['authorize', 'capture', 'refund', 'payout']
const newKey = () => `idem_${Math.random().toString(36).slice(2, 8)}`
const STAGES = ['API', 'Postgres txn', 'Debezium', 'Kafka', 'Projector', 'Read model']
type LogEntry = { id: number; req: string; res: Response }
let logId = 0

function LedgerSim() {
  const reduced = useReducedMotion()
  const [s, setS] = useState<LedgerState>(() => initialLedger())
  const [op, setOp] = useState<Op>('authorize')
  const [amount, setAmount] = useState(500)
  const [key, setKey] = useState(newKey)
  const [poison, setPoison] = useState(false)
  const [hot, setHot] = useState<{ i: number; bad?: boolean } | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [last, setLast] = useState<{ op: Op; amount: number; key: string } | null>(null)
  const [freshTxn, setFreshTxn] = useState(0)
  const timers = useRef<number[]>([])
  const stRef = useRef(s)
  stRef.current = s
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, reduced ? 0 : ms)) }

  const send = (o: Op, amt: number, k: string) => {
    timers.current.forEach(clearTimeout); timers.current = []
    const { state, response } = execute(stRef.current, o, amt, k)
    setLog((l) => [{ id: ++logId, req: `POST /payments/pay_01/${o}  amount=${amt}  Idempotency-Key: ${k}`, res: response }, ...l].slice(0, 6))
    setLast({ op: o, amount: amt, key: k })
    setS(state)
    setFreshTxn(state.txn)
    setKey(newKey())
    setHot({ i: 0 })
    if (response.status !== 201 || response.replayed) { later(450, () => setHot(null)); return }
    later(350, () => setHot({ i: 1 }))
    later(750, () => { setHot({ i: 2 }); setS((x) => relay(x)) })
    later(1150, () => setHot({ i: 3 }))
    later(1550, () => {
      let x = stRef.current
      let bad = false
      let usePoison = poison
      while (x.consumed < x.topic.length) {
        const r = consumeOne(x, usePoison)
        if (r.outcome === 'dlq') bad = true
        usePoison = false
        x = r.state
      }
      if (poison) setPoison(false)
      setS(x)
      setHot({ i: 4, bad })
      later(450, () => setHot(bad ? { i: 4, bad } : { i: 5 }))
      later(1200, () => setHot(null))
    })
  }

  const tb = trialBalance(s)
  const bal = balances(s)
  const proj = s.projection[s.payment.id]

  return (
    <div className="panel pc">
      <div className="panel__head"><span>in-browser model of paycore's write path</span><button type="button" className="btn btn--sm" onClick={() => { timers.current.forEach(clearTimeout); setS(initialLedger()); setLog([]); setLast(null); setHot(null) }}>reset</button></div>

      <div className="pc__cmd">
        <div className="pc__ops" role="radiogroup" aria-label="Operation">
          {OPS.map((o) => <button key={o} type="button" role="radio" aria-checked={op === o} className={`pc__op${op === o ? ' is-sel' : ''}`} onClick={() => setOp(o)}>{o}</button>)}
        </div>
        <label className="pc__field"><span className="demo__note">amount (₹)</span><input className="input" type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(Math.floor(+e.target.value))} /></label>
        <label className="pc__field pc__field--key"><span className="demo__note">idempotency-key</span><input className="input" value={key} onChange={(e) => setKey(e.target.value)} /></label>
        <div className="pc__actions">
          <button type="button" className="btn btn--signal" onClick={() => send(op, amount, key)}>send {op}</button>
          <button type="button" className="btn" disabled={!last} onClick={() => last && send(last.op, last.amount, last.key)} title="Resend the previous request with the same idempotency key">retry last (same key)</button>
          <label className="pc__poison"><input type="checkbox" checked={poison} onChange={(e) => setPoison(e.target.checked)} /> poison next event</label>
        </div>
      </div>

      <div className="flow pc__flow" aria-hidden="true">
        {STAGES.map((t, i) => <div key={t} className={`flow__stage ${hot && hot.i === i ? (hot.bad ? 'is-bad' : 'is-hot') : hot && i < hot.i ? 'is-ok' : ''}`}><b>{t}</b><span>{['idempotency check', 'postings + outbox, one commit', 'CDC on outbox', 'payments · protobuf', 'ordered per key', 'CQRS view'][i]}</span></div>)}
      </div>

      <div className="pc__grid">
        <section className="pc__box" aria-label="Ledger postings">
          <div className="pc__boxhead"><span>ledger_entries</span><span className={tb.balanced ? 'ok' : 'bad'}>{tb.balanced ? `✓ balanced · DR ${tb.debits} = CR ${tb.credits}` : 'UNBALANCED'}</span></div>
          <div className="scroll-x pc__scroll">
            <table className="tbl">
              <thead><tr><th>txn</th><th>account</th><th className="num">debit</th><th className="num">credit</th></tr></thead>
              <tbody>
                {s.postings.length === 0 && <tr><td colSpan={4} className="dim">no postings yet - authorize a payment</td></tr>}
                {[...s.postings].reverse().map((p, i) => (
                  <tr key={`${p.txn}-${p.account}-${i}`} className={p.txn === freshTxn ? 'is-new' : ''}><td>{p.txn}</td><td>{p.account}</td><td className="num">{p.debit || ''}</td><td className="num">{p.credit || ''}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pc__bal mono">{ACCOUNTS.map((a) => <span key={a}>{a} <b>{bal[a]}</b></span>)}</div>
        </section>

        <section className="pc__box" aria-label="Outbox and Kafka topic">
          <div className="pc__boxhead"><span>outbox → payments topic</span><span>{s.topic.length} records</span></div>
          <div className="pc__scroll">
            <table className="tbl">
              <thead><tr><th>seq</th><th>event</th><th>relayed</th></tr></thead>
              <tbody>
                {s.outbox.length === 0 && <tr><td colSpan={3} className="dim">empty</td></tr>}
                {[...s.outbox].reverse().map((r) => <tr key={r.seq}><td>{r.seq}</td><td>{r.type}</td><td className={r.relayed ? 'ok' : 'warn'}>{r.relayed ? `offset ${s.topic.find((t) => t.seq === r.seq)?.offset}` : 'pending'}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pc__box" aria-label="Read model">
          <div className="pc__boxhead"><span>read model (CQRS)</span><span>consumer @ offset {s.consumed}</span></div>
          <pre className="pc__json mono">{proj ? JSON.stringify({ [s.payment.id]: proj }, null, 2) : '{ }'}</pre>
          <div className={`pc__dlq${s.dlq.length ? ' is-on' : ''}`}>
            <span className="mono">dead-letter · {s.dlq.length} parked{s.dlq.length > 1 ? ' (ordered behind the first failure)' : ''}</span>
            <button type="button" className="btn btn--sm" disabled={!s.dlq.length} onClick={() => setS((x) => replayDlq(x))}>replay dlq</button>
          </div>
        </section>

        <section className="pc__box" aria-label="HTTP responses">
          <div className="pc__boxhead"><span>responses</span><span>latest first</span></div>
          <ol className="pc__log mono" aria-live="polite">
            {log.length === 0 && <li className="dim">send a request…</li>}
            {log.map((l) => (
              <li key={l.id}>
                <span className="dim">{l.req}</span>
                <span className={l.res.status === 201 ? 'ok' : 'bad'}>{l.res.status} {l.res.body}{l.res.replayed ? '  ← replayed from idempotency store, no new postings' : ''}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <p className="demo__note" style={{ padding: '0 14px 14px' }}>Try: authorize → capture → retry last (same key) → refund too much → poison next event → replay dlq. The rules mirror PayCore; the storage is an in-memory model.</p>
    </div>
  )
}

function K6() {
  return (
    <div className="panel">
      <div className="panel__head"><span>k6 load test · real run · via go gateway</span><span>10 VUs × 2 min</span></div>
      <div className="k6 mono">
        <div><span>payment flows completed</span><b>4,241</b></div>
        <div><span>http_req_failed</span><b className="ok">0.00%</b></div>
        <div><span>capture latency p(95)</span><b>330.8 ms</b></div>
        <div><span>ledger drift after run</span><b className="ok">0</b></div>
      </div>
    </div>
  )
}

export default function PayCoreDemo() {
  return (
    <div className="demo">
      <LedgerSim />
      <K6 />
    </div>
  )
}
