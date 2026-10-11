import { useCallback, useRef, useState } from 'react'
import { getQuote, placeOrder } from '../api'
import { useApi } from '../useApi'
import { EMAIL_KEY, money, toItems } from '../format'
import { deliveryTime } from '../format'
import Breadcrumbs from '../components/Breadcrumbs'

const EMPTY = { email: '', fullName: '', street: '', city: '', state: '', zip: '', phone: '' }
const EMPTY_CARD = { number: '', expiry: '', cvv: '', name: '' }

const formatCardNumber = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
const formatExpiry = (v) => {
  const digits = v.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export default function Checkout({ cart, onOrdered, showToast }) {
  const [form, setForm] = useState({ ...EMPTY, email: localStorage.getItem(EMAIL_KEY) || '' })
  const [card, setCard] = useState(EMPTY_CARD)
  const [saveAddress, setSaveAddress] = useState(false)
  const [delivery, setDelivery] = useState('standard')
  const [method, setMethod] = useState('card')
  const [placing, setPlacing] = useState(false)
  const [formError, setFormError] = useState('')
  const cardRef = useRef(null)

  const loader = useCallback(() => (cart.length ? getQuote(toItems(cart), delivery) : Promise.resolve(null)), [cart, delivery])
  const { data, error: quoteError, stale } = useApi(loader)
  const summary = data || stale

  const setField = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const setCardField = (name, value) => setCard({ ...card, [name]: value })

  const submit = async (event) => {
    event.preventDefault()
    setFormError('')
    setPlacing(true)
    try {
      const result = await placeOrder({
        items: toItems(cart),
        delivery,
        saveAddress,
        customer: form,
        payment: method === 'card' ? { method, card } : { method },
      })
      localStorage.setItem(EMAIL_KEY, form.email.trim().toLowerCase())
      onOrdered(result.orderNumber)
    } catch (err) {
      if (err.status === 402) {
        // a declined card gets its own message with a shortcut back to the card field
        setMethod('card')
        showToast({
          type: 'error',
          title: 'Payment Failed',
          message: err.message,
          actionLabel: 'Update Payment',
          onAction: () => cardRef.current && cardRef.current.focus(),
        })
      } else {
        setFormError(err.message)
      }
    } finally {
      setPlacing(false)
    }
  }

  if (cart.length === 0) {
    return (
      <section className="section">
        <Breadcrumbs items={[{ label: 'Home', href: '#/' }, { label: 'Shopping Cart', href: '#/cart' }, { label: 'Holiday Checkout' }]} />
        <div className="empty-state">
          <p>Your cart is empty, so there is nothing to check out.</p>
          <a className="btn btn-crimson" href="#/shop">Find a holiday gift</a>
        </div>
      </section>
    )
  }

  const rates = summary && summary.rates

  return (
    <section className="section">
      <Breadcrumbs items={[{ label: 'Home', href: '#/' }, { label: 'Shopping Cart', href: '#/cart' }, { label: 'Holiday Checkout' }]} />
      <h1 className="page-title script">Secure Holiday Checkout</h1>

      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-fields">
          <fieldset>
            <legend>1. Contact &amp; Shipping Address</legend>
            <div className="field-grid">
              <label className="span-2">Email<input name="email" type="email" autoComplete="email" required value={form.email} onChange={setField} /></label>
              <label className="span-2">Full Name<input name="fullName" autoComplete="name" required value={form.fullName} onChange={setField} /></label>
              <label className="span-2">Street Address<input name="street" autoComplete="street-address" required value={form.street} onChange={setField} /></label>
              <label>City<input name="city" autoComplete="address-level2" required value={form.city} onChange={setField} /></label>
              <label>State / Province<input name="state" autoComplete="address-level1" required value={form.state} onChange={setField} /></label>
              <label>Zip Code<input name="zip" autoComplete="postal-code" required value={form.zip} onChange={setField} /></label>
              <label>Phone Number<input name="phone" type="tel" autoComplete="tel" required value={form.phone} onChange={setField} /></label>
            </div>
            <label className="check">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Save this address for future purchases
            </label>
          </fieldset>

          <fieldset>
            <legend>2. Delivery Method</legend>
            {data?.estimatedDelivery && <p className="hint">Estimated arrival: {deliveryTime(data.estimatedDelivery.start)} – {deliveryTime(data.estimatedDelivery.end)}</p>}
            <label className="radio">
              <input type="radio" name="delivery" checked={delivery === 'standard'} onChange={() => setDelivery('standard')} />
              Standard Shipping (FREE, estimated in 3 days)
            </label>
            <label className="radio">
              <input type="radio" name="delivery" checked={delivery === 'express'} onChange={() => setDelivery('express')} />
              Express Courier ({rates ? money(rates.expressShipping, summary.currency || 'USD') : 'calculating…'}, estimated next day)
            </label>
          </fieldset>

          <fieldset>
            <legend>3. Payment Method</legend>
            <div className="pay-tabs" role="tablist" aria-label="Payment method">
              {[['card', 'Credit/Debit Card'], ['paypal', 'PayPal'], ['gpay', 'Google Pay']].map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={method === key} className={method === key ? 'active' : ''} onClick={() => setMethod(key)}>
                  {label}
                </button>
              ))}
            </div>

            {method === 'card' ? (
              <div className="field-grid">
                <label className="span-2">Card Number
                  <input ref={cardRef} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" required
                    value={card.number} onChange={(e) => setCardField('number', formatCardNumber(e.target.value))} />
                </label>
                <label>Expiry (MM/YY)
                  <input inputMode="numeric" autoComplete="cc-exp" placeholder="12/30" required
                    value={card.expiry} onChange={(e) => setCardField('expiry', formatExpiry(e.target.value))} />
                </label>
                <label>CVV
                  <input inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} required
                    value={card.cvv} onChange={(e) => setCardField('cvv', e.target.value.replace(/\D/g, ''))} />
                </label>
                <label className="span-2">Name on Card
                  <input autoComplete="cc-name" required value={card.name} onChange={(e) => setCardField('name', e.target.value)} />
                </label>
                <p className="hint span-2">
                  Demo store, no real money. Test card <strong>4242 4242 4242 4242</strong> is approved (any future date, any CVV).
                  Card <strong>4000 0000 0000 0002</strong> is declined.
                </p>
              </div>
            ) : (
              <p className="hint">Demo store: {method === 'paypal' ? 'PayPal' : 'Google Pay'} is simulated and approves the payment instantly.</p>
            )}
          </fieldset>
        </div>

        <aside className="summary-card" aria-label="Order summary and payment">
          <h2>Order Summary &amp; Payment</h2>
          <ul className="summary-lines">
            {summary && summary.lines.map((l) => (
              <li key={l.productId}><span>{l.name} <small>× {l.quantity}</small></span><span>{money(l.lineTotal, summary.currency || 'USD')}</span></li>
            ))}
          </ul>
          {quoteError && <p className="notice notice-error">{quoteError} <a href="#/cart">Back to cart</a></p>}
          {summary && !quoteError && (
            <dl className="summary-rows">
              <div><dt>Subtotal</dt><dd>{money(summary.subtotal, summary.currency || 'USD')}</dd></div>
              {summary.discount > 0 && <div className="summary-discount"><dt>Holiday offer</dt><dd>−{money(summary.discount, summary.currency || 'USD')}</dd></div>}
              <div><dt>Shipping</dt><dd>{summary.shipping === 0 ? 'FREE' : money(summary.shipping, summary.currency || 'USD')}</dd></div>
              <div className="summary-total"><dt>Total Amount</dt><dd>{money(summary.total, summary.currency || 'USD')}</dd></div>
            </dl>
          )}
          {formError && <p className="notice notice-error" role="alert">{formError}</p>}
          <button type="submit" className="btn btn-gold btn-block" disabled={placing || Boolean(quoteError) || !summary}>
            🔒 {placing ? 'Placing order...' : `Place Order${summary ? ` (${money(summary.total, summary.currency || 'USD')})` : ''}`}
          </button>
          <p className="hint center">100% Secure Checkout · 30-Day Holiday Return Policy</p>
        </aside>
      </form>
    </section>
  )
}
