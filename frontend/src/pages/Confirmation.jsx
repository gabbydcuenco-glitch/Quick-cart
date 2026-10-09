import { useCallback, useState } from 'react'
import { getOrder } from '../api'
import { useApi } from '../useApi'
import { money, shortDate } from '../format'
import DeliveryTracking from '../components/DeliveryTracking'
import Breadcrumbs from '../components/Breadcrumbs'

export default function Confirmation({ orderNumber }) {
  const [revision, setRevision] = useState(0)
  const loader = useCallback(() => { void revision; return getOrder(orderNumber) }, [orderNumber, revision])
  const { data: order, error, loading } = useApi(loader)

  const crumbs = [
    { label: 'Home', href: '#/' },
    { label: 'Shopping Cart', href: '#/cart' },
    { label: 'Holiday Checkout', href: '#/checkout' },
    { label: `Order Confirmation (#${orderNumber})` },
  ]

  return (
    <section className="section">
      <Breadcrumbs items={crumbs} />
      {loading && <p className="notice">Loading your order...</p>}
      {error && <p className="notice notice-error">{error}</p>}
      {order && (
        <div className="confirmation">
          <h1 className="page-title">Thank you for your order! 🎄</h1>
          <p>
            Your order <strong>#{order.orderNumber}</strong> was placed on {shortDate(order.createdAt)} and is{' '}
            <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>.
          </p>
          <DeliveryTracking key={orderNumber} order={order} onUpdate={() => setRevision(r => r + 1)} />
          <ul className="summary-lines">
            {order.items.map((i) => (
              <li key={i.productId}><span>{i.name} <small>× {i.quantity}</small></span><span>{money(i.unitPrice * i.quantity)}</span></li>
            ))}
          </ul>
          <dl className="summary-rows">
            <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="summary-discount"><dt>Holiday offer</dt><dd>−{money(order.discount)}</dd></div>}
            <div><dt>Shipping</dt><dd>{order.shipping === 0 ? 'FREE' : money(order.shipping)}</dd></div>
            <div className="summary-total"><dt>Total paid</dt><dd>{money(order.total)}</dd></div>
          </dl>
          <p className="hint">Payment reference: {order.paymentReference}</p>
          <div className="button-row">
            <a className="btn btn-crimson" href="#/account">Track in My Account</a>
            <a className="btn btn-gold" href="#/shop">Keep shopping</a>
          </div>
        </div>
      )}
    </section>
  )
}
