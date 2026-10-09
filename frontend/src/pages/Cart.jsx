import { useCallback } from 'react'
import { getQuote } from '../api'
import { useApi } from '../useApi'
import { MAX_QTY, money, toItems } from '../format'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductImage from '../components/ProductImage'

export default function Cart({ cart, products, setQuantity, removeItem, clearCart }) {
  const byId = new Map((products || []).map((p) => [p.id, p]))

  // The order summary always comes from order-api, so the website never calculates money itself
  const loader = useCallback(() => (cart.length ? getQuote(toItems(cart), 'standard') : Promise.resolve(null)), [cart])
  const { data, error, stale } = useApi(loader)
  const summary = data || stale

  return (
    <section className="section">
      <Breadcrumbs items={[{ label: 'Home', href: '#/' }, { label: 'Shopping Cart' }]} />
      <h1 className="page-title">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <a className="btn btn-crimson" href="#/shop">Find a holiday gift</a>
        </div>
      ) : (
        <div className="cart-layout">
          <ul className="cart-lines">
            {cart.map((line) => {
              const p = byId.get(line.id)
              return (
                <li key={line.id} className="cart-line">
                  {p ? <ProductImage slug={p.slug} /> : <div className="product-image tint-cream" />}
                  <div className="cart-line-info">
                    <a href={`#/product/${line.id}`}><strong>{p ? p.name : 'Item no longer available'}</strong></a>
                    {p && <span>{money(p.price)} each</span>}
                    <div className="qty-stepper">
                      <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(line.id, line.quantity - 1)}>−</button>
                      <span aria-live="polite">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={!p || line.quantity >= Math.min(MAX_QTY, p.stock)}
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                      >+</button>
                      <button type="button" className="link-button" onClick={() => removeItem(line.id)}>Remove</button>
                    </div>
                  </div>
                  {p && <strong className="cart-line-total">{money(p.price * line.quantity)}</strong>}
                </li>
              )
            })}
          </ul>

          <aside className="summary-card" aria-label="Order summary">
            <h2>Order Summary</h2>
            {error && <p className="notice notice-error">{error}</p>}
            {summary && !error && (
              <dl className="summary-rows">
                <div><dt>Subtotal</dt><dd>{money(summary.subtotal)}</dd></div>
                {summary.discount > 0 && (
                  <div className="summary-discount"><dt>Holiday offer</dt><dd>−{money(summary.discount)}</dd></div>
                )}
                <div><dt>Shipping</dt><dd>FREE</dd></div>
                <div className="summary-total"><dt>Total</dt><dd>{money(summary.total)}</dd></div>
              </dl>
            )}
            {summary && !error && summary.discount === 0 && (
              <p className="hint">
                Add {money(summary.rates.discountThreshold - summary.subtotal)} more to get {money(summary.rates.discountAmount)} off.
              </p>
            )}
            <a className={`btn btn-gold btn-block${error ? ' btn-disabled' : ''}`} href={error ? undefined : '#/checkout'} aria-disabled={Boolean(error)}>
              Proceed to Checkout
            </a>
            <button type="button" className="link-button" onClick={clearCart}>Clear cart</button>
          </aside>
        </div>
      )}
    </section>
  )
}
