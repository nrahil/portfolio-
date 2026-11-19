// An in-browser model of PayCore's write path: idempotent commands → balanced
// double-entry postings + outbox row in one "transaction" → CDC relay → Kafka →
// ordered CQRS projection with dead-letter parking and replay.

export type Op = 'authorize' | 'capture' | 'refund' | 'payout'
export type Account = 'customer' | 'auth_hold' | 'merchant' | 'payout_bank'
export const ACCOUNTS: Account[] = ['customer', 'auth_hold', 'merchant', 'payout_bank']

export type Posting = { txn: number; account: Account; debit: number; credit: number; op: Op }
export type OutboxRow = { seq: number; type: string; paymentId: string; amount: number; relayed: boolean }
export type KafkaRecord = { offset: number; key: string; type: string; amount: number; seq: number }
export type Projection = Record<string, { status: string; authorized: number; captured: number; refunded: number; version: number }>

export type Response = { status: number; body: string; replayed?: boolean }

export type LedgerState = {
  txn: number
  postings: Posting[]
  outbox: OutboxRow[]
  topic: KafkaRecord[]
  consumed: number // next topic offset the projector will read
  projection: Projection
  dlq: KafkaRecord[]
  idem: Record<string, { fingerprint: string; response: Response }>
  payment: { id: string; authorized: number; captured: number; refunded: number; paidOut: number }
}

export const initialLedger = (paymentId = 'pay_01'): LedgerState => ({
  txn: 0,
  postings: [],
  outbox: [],
  topic: [],
  consumed: 0,
  projection: {},
  dlq: [],
  idem: {},
  payment: { id: paymentId, authorized: 0, captured: 0, refunded: 0, paidOut: 0 },
})

const LEGS: Record<Op, [Account, Account]> = {
  authorize: ['auth_hold', 'customer'], // DR hold, CR customer
  capture: ['merchant', 'auth_hold'],
  refund: ['customer', 'merchant'],
  payout: ['payout_bank', 'merchant'],
}

function validate(s: LedgerState, op: Op, amount: number): string | null {
  const p = s.payment
  if (!Number.isInteger(amount) || amount <= 0) return 'amount must be a positive integer'
  switch (op) {
    case 'authorize':
      return p.authorized > 0 ? 'payment already authorized' : null
    case 'capture':
      return amount > p.authorized - p.captured ? 'capture exceeds remaining authorization' : null
    case 'refund':
      return amount > p.captured - p.refunded ? 'refund exceeds captured amount' : null
    case 'payout':
      return amount > p.captured - p.refunded - p.paidOut ? 'payout exceeds merchant balance' : null
  }
}

/** Execute a command. Same idempotency key + same request → cached response, no new postings. */
export function execute(s: LedgerState, op: Op, amount: number, key: string): { state: LedgerState; response: Response } {
  const fingerprint = `${op}:${amount}`
  const prior = s.idem[key]
  if (prior) {
    if (prior.fingerprint !== fingerprint) {
      return { state: s, response: { status: 422, body: `idempotency key reused with a different request (${prior.fingerprint})` } }
    }
    return { state: s, response: { ...prior.response, replayed: true } }
  }
  const err = validate(s, op, amount)
  if (err) {
    const response = { status: 409, body: err }
    return { state: { ...s, idem: { ...s.idem, [key]: { fingerprint, response } } }, response }
  }
  const txn = s.txn + 1
  const [dr, cr] = LEGS[op]
  const postings: Posting[] = [
    { txn, account: dr, debit: amount, credit: 0, op },
    { txn, account: cr, debit: 0, credit: amount, op },
  ]
  const p = { ...s.payment }
  if (op === 'authorize') p.authorized += amount
  if (op === 'capture') p.captured += amount
  if (op === 'refund') p.refunded += amount
  if (op === 'payout') p.paidOut += amount
  const type = { authorize: 'PaymentAuthorized', capture: 'PaymentCaptured', refund: 'PaymentRefunded', payout: 'PayoutSent' }[op]
  const response: Response = { status: 201, body: `${type} txn=${txn} amount=${amount}` }
  return {
    response,
    state: {
      ...s,
      txn,
      payment: p,
      postings: [...s.postings, ...postings],
      outbox: [...s.outbox, { seq: txn, type, paymentId: p.id, amount, relayed: false }],
      idem: { ...s.idem, [key]: { fingerprint, response } },
    },
  }
}

/** Debezium-style relay: publish un-relayed outbox rows to the topic in commit order. */
export function relay(s: LedgerState): LedgerState {
  const pending = s.outbox.filter((r) => !r.relayed)
  if (!pending.length) return s
  let offset = s.topic.length
  const records = pending.map((r) => ({ offset: offset++, key: r.paymentId, type: r.type, amount: r.amount, seq: r.seq }))
  return { ...s, outbox: s.outbox.map((r) => ({ ...r, relayed: true })), topic: [...s.topic, ...records] }
}

function applyToProjection(proj: Projection, rec: KafkaRecord): Projection {
  const cur = proj[rec.key] ?? { status: 'NEW', authorized: 0, captured: 0, refunded: 0, version: 0 }
  const next = { ...cur, version: rec.seq }
  if (rec.type === 'PaymentAuthorized') { next.authorized += rec.amount; next.status = 'AUTHORIZED' }
  if (rec.type === 'PaymentCaptured') { next.captured += rec.amount; next.status = 'CAPTURED' }
  if (rec.type === 'PaymentRefunded') { next.refunded += rec.amount; next.status = next.refunded >= next.captured ? 'REFUNDED' : 'PARTIALLY_REFUNDED' }
  if (rec.type === 'PayoutSent') { next.status = next.status === 'NEW' ? 'PAID_OUT' : next.status }
  return { ...proj, [rec.key]: next }
}

/**
 * Projector consumes one record. If `poison` is true the record fails and is parked in the DLQ.
 * Ordering: once a key has a parked record, later records for that key are parked behind it.
 */
export function consumeOne(s: LedgerState, poison = false): { state: LedgerState; outcome: 'applied' | 'dlq' | 'idle' } {
  const rec = s.topic[s.consumed]
  if (!rec) return { state: s, outcome: 'idle' }
  const blocked = s.dlq.some((d) => d.key === rec.key)
  if (poison || blocked) return { state: { ...s, consumed: s.consumed + 1, dlq: [...s.dlq, rec] }, outcome: 'dlq' }
  return { state: { ...s, consumed: s.consumed + 1, projection: applyToProjection(s.projection, rec) }, outcome: 'applied' }
}

/** Replay parked records in their original order. */
export function replayDlq(s: LedgerState): LedgerState {
  let proj = s.projection
  for (const rec of [...s.dlq].sort((a, b) => a.offset - b.offset)) proj = applyToProjection(proj, rec)
  return { ...s, projection: proj, dlq: [] }
}

export function balances(s: LedgerState): Record<Account, number> {
  const b = { customer: 0, auth_hold: 0, merchant: 0, payout_bank: 0 } as Record<Account, number>
  for (const p of s.postings) b[p.account] += p.debit - p.credit
  return b
}

export function trialBalance(s: LedgerState): { debits: number; credits: number; balanced: boolean } {
  let debits = 0, credits = 0
  for (const p of s.postings) { debits += p.debit; credits += p.credit }
  return { debits, credits, balanced: debits === credits }
}
