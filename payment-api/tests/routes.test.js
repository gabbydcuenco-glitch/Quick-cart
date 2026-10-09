const request = require('supertest');
const app = require('../src/server');

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.service).toBe('payment-api');
});

test('POST /api/payment/charge approves PayPal', async () => {
  const res = await request(app).post('/api/payment/charge').send({ method: 'paypal', amountCents: 1500 });
  expect(res.status).toBe(200);
  expect(res.body.approved).toBe(true);
});

test('POST /api/payment/charge answers 400 for an invalid amount', async () => {
  const res = await request(app).post('/api/payment/charge').send({ method: 'paypal', amountCents: -5 });
  expect(res.status).toBe(400);
  expect(res.body.approved).toBe(false);
});

test('POST /api/payment/charge answers 400 for broken JSON', async () => {
  const res = await request(app).post('/api/payment/charge').set('Content-Type', 'application/json').send('{oops');
  expect(res.status).toBe(400);
});
