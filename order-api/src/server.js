const express = require('express');
const repo = require('./repo');
const gateway = require('./gateway');
const { estimate } = require('./tracking');
const {
  calculateTotals, mergeItems, dollars,
  HOLIDAY_DISCOUNT_THRESHOLD_CENTS, HOLIDAY_DISCOUNT_CENTS, EXPRESS_SHIPPING_CENTS,
} = require('./logic');
const { validateQuote, validateCheckout, validateTicket, isEmail } = require('./validate');

const app = express();
app.use(express.json());

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Looks up the real prices and checks the stock. Prices never come from the browser.
async function buildLines(items) {
  const merged = mergeItems(items);
  const products = await repo.getProductsByIds(merged.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));
  return merged.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw httpError(400, `Product ${item.productId} was not found`);
    if (product.currency && product.currency !== 'PHP') throw httpError(503, 'Peso catalog update is not ready. Please retry shortly.');
    if (item.quantity > product.stock) {
      throw httpError(409, product.stock === 0 ? `${product.name} is out of stock` : `Only ${product.stock} left of ${product.name}`);
    }
    return { productId: product.id, name: product.name, unitPriceCents: product.priceCents, quantity: item.quantity };
  });
}

const money = (totals) => ({
  currency: 'PHP',
  subtotal: dollars(totals.subtotalCents),
  discount: dollars(totals.discountCents),
  shipping: dollars(totals.shippingCents),
  total: dollars(totals.totalCents),
});

// Health check (Docker HEALTHCHECK and Jenkins smoke test) - also checks the database
app.get(['/health', '/api/orders/health'], async (req, res) => {
  try {
    await repo.ping();
    res.json({ status: 'ok', service: 'order-api' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'db-error' });
  }
});

// Live order summary for the cart and checkout pages
app.post('/api/orders/quote', async (req, res) => {
  const check = validateQuote(req.body);
  if (!check.valid) return res.status(400).json({ error: check.errors.join(', ') });

  const lines = await buildLines(req.body.items);
  const totals = calculateTotals(lines, req.body.delivery);
  res.json({
    lines: lines.map((l) => ({
      productId: l.productId, name: l.name, quantity: l.quantity,
      unitPrice: dollars(l.unitPriceCents), lineTotal: dollars(l.unitPriceCents * l.quantity),
    })),
    ...money(totals),
    estimatedDelivery: estimate(req.body.delivery),
    // the shop rules, so the website never has to repeat them
    rates: {
      discountThreshold: dollars(HOLIDAY_DISCOUNT_THRESHOLD_CENTS),
      discountAmount: dollars(HOLIDAY_DISCOUNT_CENTS),
      expressShipping: dollars(EXPRESS_SHIPPING_CENTS),
    },
  });
});

// Checkout: validate -> real prices + stock -> charge payment -> save order in one transaction
app.post('/api/orders', async (req, res) => {
  const check = validateCheckout(req.body);
  if (!check.valid) return res.status(400).json({ error: check.errors.join(', ') });

  const { customer, delivery, payment, saveAddress } = req.body;
  const lines = await buildLines(req.body.items);
  const totals = calculateTotals(lines, delivery);

  let paid;
  try {
    paid = await gateway.charge({ method: payment.method, amountCents: totals.totalCents, card: payment.card });
  } catch (err) {
    console.error(err.message);
    return res.status(502).json({ error: 'The payment service is not available. Please try again.' });
  }
  if (!paid.approved) return res.status(402).json({ error: paid.reason || 'Payment failed' });

  try {
    const orderNumber = await repo.createOrder({
      customer, saveAddress: saveAddress === true, delivery, lines, totals,
      payment: { method: payment.method, reference: paid.reference },
    });
    res.status(201).json({ orderNumber, status: 'Processing', paymentReference: paid.reference, ...money(totals) });
  } catch (err) {
    if (err.code === 'OUT_OF_STOCK') return res.status(409).json({ error: err.message });
    throw err;
  }
});

// My Account: GET /api/orders?email=john@example.com
app.get('/api/orders', async (req, res) => {
  if (!isEmail(req.query.email)) return res.status(400).json({ error: 'A valid email is required' });
  res.json(await repo.listOrdersByEmail(req.query.email));
});

app.get('/api/orders/:orderNumber', async (req, res) => {
  const order = await repo.getOrderByNumber(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/api/orders/:orderNumber/delivery', async (req, res) => {
  if (process.env.DELIVERY_DEMO !== 'true') return res.status(403).json({ error: 'Delivery demo controls are disabled.' });
  const { action, expectedStatus } = req.body || {};
  if (!['advance', 'receive'].includes(action) || typeof expectedStatus !== 'string') {
    return res.status(400).json({ error: 'A valid delivery action and current status are required.' });
  }
  res.json(await repo.updateDelivery(req.params.orderNumber, action, expectedStatus));
});

// Contact page
app.post('/api/support/tickets', async (req, res) => {
  const check = validateTicket(req.body);
  if (!check.valid) return res.status(400).json({ error: check.errors.join(', ') });
  const ticketId = await repo.createTicket(req.body);
  res.status(201).json({ ticketId });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Express 5 passes errors from async routes here; details stay in the log (never card data)
app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error(err.message);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3002;
if (require.main === module) {
  require('./migrate')().then(() => {
    app.listen(PORT, () => console.log(`order-api running on port ${PORT}`));
  }).catch(error => { console.error('Database migration failed:', error.message); process.exit(1); });
}

module.exports = app;
