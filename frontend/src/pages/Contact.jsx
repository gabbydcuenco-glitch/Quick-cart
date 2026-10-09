import { useState } from 'react'
import { sendTicket } from '../api'
import Breadcrumbs from '../components/Breadcrumbs'

const EMPTY = { name: '', email: '', subject: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [sending, setSending] = useState(false)

  const setField = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setSending(true)
    setStatus({ type: '', text: '' })
    try {
      const { ticketId } = await sendTicket(form)
      setStatus({ type: 'ok', text: `Thank you! Your message was received (ticket #${ticketId}). We will reply by email.` })
      setForm(EMPTY)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="section">
      <Breadcrumbs items={[{ label: 'Home', href: '#/' }, { label: 'Contact' }]} />
      <h1 className="page-title">Get in Touch</h1>
      <p>Need help with your holiday shopping? We are here to bring you cheer and support.</p>

      <div className="contact-layout">
        <form className="contact-form" onSubmit={submit}>
          <h2>Send a Message</h2>
          <label>Name<input name="name" required value={form.name} onChange={setField} /></label>
          <label>Email<input name="email" type="email" required value={form.email} onChange={setField} /></label>
          <label>Subject<input name="subject" required value={form.subject} onChange={setField} /></label>
          <label>Message<textarea name="message" rows="5" required value={form.message} onChange={setField} /></label>
          <button type="submit" className="btn btn-gold" disabled={sending}>{sending ? 'Sending...' : 'Send Message'}</button>
          {status.text && <p className={`notice ${status.type === 'error' ? 'notice-error' : 'notice-ok'}`} role="status">{status.text}</p>}
        </form>

        <div>
          <h2>Contact Information</h2>
          <ul className="contact-info">
            <li>✉️ support@quickcart.example</li>
            <li>📞 +63 917 123 4567</li>
            <li>📍 123 Pine St, Angeles City, Pampanga, 2009</li>
          </ul>
          <h2>Frequently Asked Questions</h2>
          <details>
            <summary>When will my order arrive?</summary>
            <p>Standard shipping is estimated in 3 days; express in 1 day. Checkout and order tracking show your estimated date and time. Open My Account, then Track delivery to see the timeline, sample route, and receipt confirmation. Delivery tracking is simulated for this classroom demo.</p>
          </details>
          <details>
            <summary>What is your return policy for the holidays?</summary>
            <p>Every order has a 30-day holiday return guarantee. Contact us with your order number and we will arrange the return.</p>
          </details>
          <details>
            <summary>How can I track my order?</summary>
            <p>Open My Account, enter the email you used at checkout, and you will see the status of every order.</p>
          </details>
        </div>
      </div>
    </section>
  )
}
