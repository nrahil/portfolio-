import { useState } from 'react'
import './shoplon.css'

type Product = { id: string; name: string; price: number }
type CartItem = { id: string; name: string; price: number; qty: number } // denormalized snapshot

const INITIAL: Product[] = [
  { id: 'p_tote', name: 'Canvas tote', price: 1299 },
  { id: 'p_lamp', name: 'Desk lamp', price: 2499 },
  { id: 'p_cap', name: 'Wool beanie', price: 699 },
]
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
type Widget = 'badge' | 'catalog' | 'cart' | 'hearts'

export default function ShopLonDemo() {
  const [catalog, setCatalog] = useState(INITIAL)
  const [user, setUser] = useState<string | null>(null)
  const [serverCart, setServerCart] = useState<CartItem[]>([]) // Firestore: users/{uid}/cart
  const [serverWish, setServerWish] = useState<Set<string>>(new Set()) // users/{uid}/wishlist/{productId}
  const [builds, setBuilds] = useState<Record<Widget, number>>({ badge: 1, catalog: 1, cart: 1, hearts: 1 })
  const [log, setLog] = useState<string[]>(['app start · authStateChanges() → null · no streams'])
  const [flash, setFlash] = useState<Widget[]>([])

  const rebuild = (...w: Widget[]) => {
    setBuilds((b) => { const n = { ...b }; w.forEach((k) => n[k]++); return n })
    setFlash(w); setTimeout(() => setFlash([]), 600)
  }
  const say = (m: string) => setLog((l) => [m, ...l].slice(0, 7))

  // Providers only expose data while their stream is subscribed (i.e. while signed in).
  const cart = user ? serverCart : []
  const wish = user ? serverWish : new Set<string>()

  const toggleAuth = () => {
    if (user) {
      setUser(null)
      say('authStateChanges() → null · cart.cancel() · wishlist.cancel() · providers reset')
    } else {
      setUser('uid_demo')
      say('authStateChanges() → uid_demo · subscribe users/uid_demo/cart · subscribe …/wishlist')
    }
    rebuild('badge', 'cart', 'hearts')
  }

  const add = (p: Product) => {
    if (!user) { say('add blocked - not signed in (no cart stream)'); return }
    setServerCart((c) => {
      const hit = c.find((x) => x.id === p.id)
      return hit ? c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { id: p.id, name: p.name, price: p.price, qty: 1 }]
    })
    say(`write cart/${p.id} {snapshot: ${p.name}, ${inr(p.price)}} → snapshots() emits → CartProvider.notifyListeners()`)
    rebuild('badge', 'cart')
  }

  const heart = (p: Product) => {
    if (!user) { say('wishlist blocked - not signed in'); return }
    const has = serverWish.has(p.id)
    setServerWish((s) => { const n = new Set(s); has ? n.delete(p.id) : n.add(p.id); return n })
    say(`${has ? 'delete' : 'set'} wishlist/${p.id} · lookup = doc(productId) - O(1), no query`)
    rebuild('hearts')
  }

  const reprice = () => {
    setCatalog((c) => c.map((p, i) => (i === 0 ? { ...p, price: p.price + 200 } : p)))
    say(`admin updates products/${catalog[0].id}.price → ${inr(catalog[0].price + 200)} · cart snapshot unchanged`)
    rebuild('catalog')
  }

  const total = cart.reduce((a, c) => a + c.price * c.qty, 0)
  const count = cart.reduce((a, c) => a + c.qty, 0)
  const B = ({ w }: { w: Widget }) => <span className={`sl-build${flash.includes(w) ? ' is-flash' : ''}`} title="widget rebuild count">↻{builds[w]}</span>

  return (
    <div className="panel sl">
      <div className="panel__head"><span>model of shoplon's state architecture · demo products</span><span className="demo__row"><button type="button" className="btn btn--sm" onClick={reprice}>admin: change a price</button></span></div>
      <div className="sl__body">
        <div className="sl__phone" aria-label="App preview">
          <div className="sl__notch" aria-hidden="true" />
          <div className="sl__appbar">
            <span className="sl__brand">ShopLon</span>
            <span className="sl__badge">cart {count}<B w="badge" /></span>
          </div>
          <div className="sl__auth">
            <span className="mono">{user ? '● signed in' : '○ signed out'}</span>
            <button type="button" className="btn btn--sm" onClick={toggleAuth}>{user ? 'log out' : 'log in'}</button>
          </div>
          <ul className="sl__products">
            <li className="sl__wlabel mono">catalog <B w="catalog" /> · hearts <B w="hearts" /></li>
            {catalog.map((p) => (
              <li key={p.id} className="sl__prod">
                <span className="sl__thumb" aria-hidden="true" />
                <span className="sl__pname">{p.name}<small>{inr(p.price)}</small></span>
                <button type="button" className={`sl__heart${wish.has(p.id) ? ' is-on' : ''}`} onClick={() => heart(p)} aria-pressed={wish.has(p.id)} aria-label={`Wishlist ${p.name}`}>♥</button>
                <button type="button" className="sl__add" onClick={() => add(p)} aria-label={`Add ${p.name} to cart`}>+</button>
              </li>
            ))}
          </ul>
          <div className="sl__cart">
            <div className="sl__wlabel mono">cart summary <B w="cart" /></div>
            {cart.length === 0 ? <p className="dim sl__empty">{user ? 'empty' : 'sign in to see your cart'}</p> : cart.map((c) => {
              const live = catalog.find((p) => p.id === c.id)!.price
              return (
                <div key={c.id} className="sl__line">
                  <span>{c.qty}× {c.name}</span>
                  <span>{inr(c.price * c.qty)}{live !== c.price && <em title="catalog price changed; cart keeps the snapshot it was added with"> catalog now {inr(live)}</em>}</span>
                </div>
              )
            })}
            {cart.length > 0 && <div className="sl__line sl__total"><span>total</span><span>{inr(total)}</span></div>}
          </div>
        </div>

        <div className="sl__arch">
          <div className="sl__layer">
            <span className="demo__note">firestore</span>
            <div className="sl__nodes mono"><span>products/*</span><span>users/{'{uid}'}/cart</span><span>users/{'{uid}'}/wishlist/{'{productId}'}</span></div>
          </div>
          <div className="sl__layer">
            <span className="demo__note">streams · lifecycle bound to authStateChanges()</span>
            <div className="sl__nodes mono">
              <span className={`sl__stream${user ? ' is-live' : ''}`}>cart.snapshots() - {user ? 'listening' : 'cancelled'}</span>
              <span className={`sl__stream${user ? ' is-live' : ''}`}>wishlist.snapshots() - {user ? 'listening' : 'cancelled'}</span>
            </div>
          </div>
          <div className="sl__layer">
            <span className="demo__note">5 ChangeNotifier providers (observer pattern)</span>
            <div className="sl__nodes sl__providers mono">{['auth', 'cart', 'wishlist', '+2 more'].map((p) => <span key={p}>{p}</span>)}</div>
          </div>
          <div className="sl__layer">
            <span className="demo__note">widgets - only consumers of changed state rebuild (↻ counts)</span>
            <div className="sl__nodes mono">
              <span>badge ↻{builds.badge}</span><span>catalog ↻{builds.catalog}</span><span>hearts ↻{builds.hearts}</span><span>cart ↻{builds.cart}</span>
            </div>
          </div>
          <ol className="sl__log mono" aria-live="polite">
            {log.map((l, i) => <li key={log.length - i} className={i === 0 ? '' : 'dim'}>{l}</li>)}
          </ol>
        </div>
      </div>
      <p className="demo__note" style={{ padding: '0 14px 14px' }}>Log in, add items, change a price (cart keeps its snapshot), then log out - streams cancel and the previous user's cart disappears. Data flows one way: Firestore → Provider → UI.</p>
    </div>
  )
}
