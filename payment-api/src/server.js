const express = require('express');
const { charge } = require('./gateway');

const app = express();
app.use(express.json());

// Health check (Docker HEALTHCHECK and Jenkins smoke test)
app.get(['/health', '/api/payment/health'], (req, res) => {
  res.json({ status: 'ok', service: 'payment-api' });
});

// Simulate a payment. The gateway routes this endpoint; checkout uses order-api
// to calculate the trusted total, request approval and save an order.
app.post('/api/payment/charge', (req, res) => {
  const result = charge(req.body || {});
  const malformed = result.reason === 'Unknown payment method' || result.reason === 'Invalid amount';
  res.status(malformed ? 400 : 200).json(result);
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// bad JSON from a client is a 400, anything else is a 500 (details stay in the log)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error(err.message);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3003;
if (require.main === module) {
  app.listen(PORT, () => console.log(`payment-api running on port ${PORT}`));
}

module.exports = app;
