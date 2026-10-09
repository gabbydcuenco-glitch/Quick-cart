import { useState } from 'react'
import { updateDelivery } from '../api'

const stages = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered']
import { deliveryTime } from '../format'

export default function DeliveryTracking({ order, onUpdate }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const t = order.tracking
  if (!t) return <p>Delivery tracking becomes available after the backend is updated.</p>
  const step = stages.indexOf(order.status)
  const point = [[80, 155], [240, 155], [395, 85], [530, 155]][Math.max(0, step)]
  async function change(action) {
    setBusy(true); setError('')
    try { onUpdate(await updateDelivery(order.orderNumber, action, order.status)) }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  return <section className="delivery-tracking" aria-label="Delivery tracking">
    <h2>Track your delivery</h2>
    <p className="delivery-demo">Classroom demo · Simulated delivery, no live rider GPS</p>
    {order.status === 'Delivered' ? <p role="status"><strong>Delivered successfully</strong> · {t.receivedAt ? `Received ${deliveryTime(t.receivedAt)}` : 'Historical delivery time unavailable'}</p> :
      <p><strong>Estimated arrival:</strong><br />{deliveryTime(t.estimatedStart)} – {deliveryTime(t.estimatedEnd)}<br /><small>Estimate only. Demo stages advance using the controls below.</small></p>}
    <ol className="delivery-stages">{stages.map((stage, i) => <li key={stage} className={i <= step ? 'complete' : ''} aria-current={i === step ? 'step' : undefined}><span>{i <= step ? '✓' : i + 1}</span>{stage}</li>)}</ol>
    <svg className="delivery-map" viewBox="0 0 610 240" role="img" aria-label={`Illustrated sample route, not a geographic map. Current delivery status: ${order.status}`}>
      <rect width="610" height="240" rx="18" fill="#edf3e8" />
      <path d="M0 45H610M0 200H610M155 0V240M320 0V240M470 0V240" stroke="#fff" strokeWidth="22" />
      <path d="M80 155H240L320 85H395L465 155H530" fill="none" stroke="#cfb038" strokeWidth="12" strokeLinecap="round" />
      <circle cx="80" cy="155" r="14" fill="#860027" /><circle cx="530" cy="155" r="14" fill="#860027" />
      <text x="30" y="190">Warehouse</text><text x="483" y="190">Destination</text>
      <circle cx={point[0]} cy={point[1]} r="23" fill="#166c52" stroke="white" strokeWidth="4" />
      <text x={point[0]} y={point[1]+6} textAnchor="middle" fill="white">{step === 3 ? '✓' : '📦'}</text>
      <text x="25" y="30">Sample route · position follows demo status</text>
    </svg>
    <p>Delivery area: <strong>{t.destination || 'See your checkout address'}</strong></p>
    <ul className="delivery-events">{t.events.map((event, i) => <li key={i}><strong>{event.status}</strong> · {deliveryTime(event.at)}<br /><small>{event.note}</small></li>)}</ul>
    {error && <p className="notice notice-error" role="alert">{error}</p>}
    {t.demoControls && step >= 0 && step < 3 && <div className="button-row">
      <button className="btn btn-crimson" disabled={busy} onClick={() => change(step === 2 ? 'receive' : 'advance')}>
        {busy ? 'Saving…' : step === 2 ? 'Confirm: I received my order' : `Demo: mark ${stages[step + 1]}`}
      </button>
    </div>}
    <button className="btn btn-gold" onClick={() => onUpdate(null)} disabled={busy}>Refresh tracking</button>
  </section>
}
