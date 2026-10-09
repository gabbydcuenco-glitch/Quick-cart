import { useCallback, useState } from 'react'
import { getOrders } from '../api'
import { useApi } from '../useApi'
import { EMAIL_KEY, money, shortDate } from '../format'
import Breadcrumbs from '../components/Breadcrumbs'

function Orders({ email }) {
  const loader = useCallback(() => getOrders(email), [email])
  const { data, error, loading } = useApi(loader)

  if (loading) return <p className="notice">Loading your orders...</p>
  if (error) return <p className="notice notice-error">{error}</p>
  if (!data.customer) return <p className="notice">No orders were found for {email} yet. <a href="#/shop">Start shopping</a></p>

  const { customer, orders } = data
  return (
    <div className="account-layout">
      <div>
        <h2>Order History</h2>
        {orders.map((order) => (
          <article key={order.orderNumber} className="order-card">
            <header>
              <div>
                <strong>Order #{order.orderNumber}</strong>
                <span>Order date: {shortDate(order.createdAt)}</span>
              </div>
              <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
            </header>
            <ul>
              {order.items.map((i) => <li key={i.productId}>{i.name} × {i.quantity}</li>)}
            </ul>
            <a className="btn btn-crimson" href={`#/order/${order.orderNumber}`}>Track delivery</a>
            <p className="order-total">Total {money(order.total)}</p>
          </article>
        ))}
      </div>
      <aside>
        <h2>Saved Address</h2>
        <div className="order-card">
          {customer.address ? (
            <>
              <strong>{customer.fullName}</strong>
              <p>{customer.address.street}<br />{customer.address.city}, {customer.address.state} {customer.address.zip}</p>
              <p>{customer.phone}</p>
            </>
          ) : (
            <p>No saved address yet. Tick “Save this address” at checkout.</p>
          )}
        </div>
      </aside>
    </div>
  )
}

export default function Account() {
  const [typed, setTyped] = useState(localStorage.getItem(EMAIL_KEY) || '')
  const [email, setEmail] = useState(localStorage.getItem(EMAIL_KEY) || '')

  const submit = (event) => {
    event.preventDefault()
    const clean = typed.trim().toLowerCase()
    localStorage.setItem(EMAIL_KEY, clean)
    setEmail(clean)
  }

  return (
    <section className="section">
      <Breadcrumbs items={[{ label: 'Home', href: '#/' }, { label: 'My Account' }]} />
      <h1 className="page-title">My Account</h1>
      <form className="inline-form" onSubmit={submit}>
        <label>Email used at checkout
          <input type="email" required value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="john@example.com" />
        </label>
        <button type="submit" className="btn btn-crimson">View my orders</button>
      </form>
      <p className="hint">Demo store: orders are found by email only (there is no password). Try john@example.com to see sample orders.</p>
      {email && <Orders email={email} />}
    </section>
  )
}
