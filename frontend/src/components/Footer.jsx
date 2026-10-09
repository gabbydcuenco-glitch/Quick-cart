import { BUILD } from '../format'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="pine-border pine-border-top" aria-hidden="true" />
      <div className="footer-columns">
        <section>
          <h4>Customer Service</h4>
          <ul>
            <li><a href="#/contact">Contact Us</a></li>
            <li><a href="#/account">Track Your Order</a></li>
            <li><a href="#/contact">FAQs</a></li>
            <li><a href="#/contact">Holiday Help Center</a></li>
          </ul>
        </section>
        <section>
          <h4>Our Promise</h4>
          <ul>
            <li>Free Standard Holiday Shipping</li>
            <li>30-Day Holiday Return Guarantee</li>
            <li>$10 off orders of $100 or more</li>
          </ul>
        </section>
        <section>
          <h4>Trust Signals</h4>
          <p className="trust-badge">🔒 Secure Checkout <small>256-bit SSL encryption</small></p>
          <p className="trust-badge">📦 30-Day Returns <small>Guaranteed holiday returns</small></p>
          <p className="payment-icons" aria-label="Accepted payments">
            <span>VISA</span><span>MasterCard</span><span>PayPal</span><span>G Pay</span>
          </p>
        </section>
      </div>
      <p className="footer-bottom">
        © 2026 QuickCart. All rights reserved. A SYSIN final project: demo store, no real payments.
        <span className="build-label">Build #{BUILD}</span>
      </p>
    </footer>
  )
}
