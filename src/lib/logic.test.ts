import { describe, it, expect } from 'vitest'
import { chunk, paramsFor, aimdStep } from '../systems/BlobCloud/chunker'
import { initialLedger, execute, relay, consumeOne, replayDlq, trialBalance, balances } from '../systems/PayCore/ledger'
import { parse, resolveSystem, resolveSection, filterStack, complete } from '../terminal/parser'

function rand(n: number, seed = 7) {
  const a = new Uint8Array(n)
  let x = seed
  for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) >>> 0; a[i] = x >>> 24 }
  return a
}

describe('chunker', () => {
  const data = rand(200_000)
  const p = paramsFor(data.length)

  it('covers the input exactly with no gaps and respects bounds', () => {
    const c = chunk(data, p)
    let pos = 0
    c.forEach((s, i) => {
      expect(s.offset).toBe(pos)
      expect(s.length).toBeLessThanOrEqual(p.max)
      if (i < c.length - 1) expect(s.length).toBeGreaterThanOrEqual(p.min)
      pos += s.length
    })
    expect(pos).toBe(data.length)
  })

  it('is deterministic', () => {
    expect(chunk(data, p)).toEqual(chunk(data, p))
  })

  it('an insertion only disturbs nearby chunks (content-defined boundaries)', () => {
    const edited = new Uint8Array(data.length + 10)
    edited.set(data.subarray(0, 1000)); edited.set(rand(10, 99), 1000); edited.set(data.subarray(1000), 1010)
    const key = (d: Uint8Array, s: { offset: number; length: number }) => Array.from(d.subarray(s.offset, s.offset + s.length)).join(',')
    const a = new Set(chunk(data, p).map((s) => key(data, s)))
    const b = chunk(edited, p).map((s) => key(edited, s))
    const reused = b.filter((k) => a.has(k)).length
    expect(reused / b.length).toBeGreaterThan(0.8)
  })

  it('AIMD adds one on success and halves on failure within 1..8', () => {
    expect(aimdStep(1, true)).toBe(2)
    expect(aimdStep(8, true)).toBe(8)
    expect(aimdStep(7, false)).toBe(3)
    expect(aimdStep(1, false)).toBe(1)
  })
})

describe('ledger', () => {
  it('stays balanced and honours idempotency keys', () => {
    let s = initialLedger()
    let r = execute(s, 'authorize', 500, 'k1'); s = r.state
    expect(r.response.status).toBe(201)
    r = execute(s, 'authorize', 500, 'k1')
    expect(r.response.replayed).toBe(true)
    expect(r.state.postings.length).toBe(2)
    r = execute(s, 'authorize', 999, 'k1')
    expect(r.response.status).toBe(422)
    s = execute(s, 'capture', 300, 'k2').state
    s = execute(s, 'refund', 100, 'k3').state
    expect(execute(s, 'refund', 1000, 'k4').response.status).toBe(409)
    s = execute(s, 'payout', 200, 'k5').state
    expect(trialBalance(s).balanced).toBe(true)
    const b = balances(s)
    expect(Object.values(b).reduce((a, x) => a + x, 0)).toBe(0)
    expect(b.merchant).toBe(0)
  })

  it('relays outbox in order and projects; poison parks the key and replay restores order', () => {
    let s = initialLedger()
    s = execute(s, 'authorize', 500, 'a').state
    s = execute(s, 'capture', 500, 'b').state
    s = relay(s)
    expect(s.topic.map((t) => t.type)).toEqual(['PaymentAuthorized', 'PaymentCaptured'])
    let c = consumeOne(s, true); s = c.state
    expect(c.outcome).toBe('dlq')
    c = consumeOne(s); s = c.state
    expect(c.outcome).toBe('dlq') // parked behind the failed record to preserve order
    expect(s.projection.pay_01).toBeUndefined()
    s = replayDlq(s)
    expect(s.projection.pay_01.status).toBe('CAPTURED')
    expect(s.dlq.length).toBe(0)
  })
})

describe('terminal parser', () => {
  it('parses args and flags', () => {
    expect(parse('stack --filter=redis -v extra')).toEqual({ cmd: 'stack', args: ['extra'], flags: { filter: 'redis', v: true } })
    expect(parse('  OPEN  "pay core" ')).toEqual({ cmd: 'open', args: ['pay core'], flags: {} })
  })
  it('resolves loose names', () => {
    expect(resolveSystem('pay')).toBe('paycore')
    expect(resolveSystem('Blob')).toBe('blob-cloud')
    expect(resolveSystem('library')).toBe('library')
    expect(resolveSystem('nope')).toBeNull()
    expect(resolveSection('projects')).toBe('systems')
    expect(resolveSection('exp')).toBe('experience')
  })
  it('filters stack and completes', () => {
    expect(filterStack('redis')[0].usedIn).toContain('paycore')
    expect(complete('op')).toEqual(['open'])
    expect(complete('open pa')).toEqual(['open paycore'])
  })
})
