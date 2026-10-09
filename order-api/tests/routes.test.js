const request = require('supertest');

// The database layer and the payment service are replaced by fakes: no MySQL and no payment-api needed
jest.mock('../src/repo', () => ({
  ping: jest.fn(),
  getProductsByIds: jest.fn(),
  createOrder: jest.fn(),
  listOrdersByEmail: jest.fn(),
  getOrderByNumber: jest.fn(),
  createTicket: jest.fn(),
}));
jest.mock('../src/gateway', () => ({ charge: jest.fn() }));
const repo = require('../src/repo');
const gateway = require('../src/gateway');
const app = require('../src/server');

const PRODUCTS = [
  { id: 1, name: 'Matching Couple PJs', priceCents: 7800, stock: 40 },
  { id: 2, name: 'Instant Film Camera Set', priceCents: 2900, stock: 60 },
  { id: 3, name: 'Double Stainless Flask Set', priceCents: 1500, stock: 2 },
];

const order = {
  items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }, { productId: 3, quantity: 1 }],
  delivery: 'standard',
  saveAddress: true,
  customer: {
    email: 'john@example.com', fullName: 'John Cuenco', street: '123 Pine St', city: 'Angeles City',
    state: 'Pampanga', zip: '2009', phone: '+63 917 123 4567',
  },
  payment: { method: 'card', card: { number: '4242424242424242', expiry: '12/30', cvv: '123', name: 'John Cuenco' } },
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  repo.getProductsByIds.mockResolvedValue(PRODUCTS);
});

describe('health', () => {
  test('is ok when the database answers', async () => {
    repo.ping.mockResolvedValue();
    const res = await request(app).get('/api/orders/health');
    expect(res.status).toBe(200);
  });
  test('is 500 when the database is down', async () => {
    repo.ping.mockRejectedValue(new Error('down'));
    const res = await request(app).get('/health');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/orders/quote', () => {
  test('returns the totals: $122 subtotal, $10 discount, $112 total', async () => {
    const res = await request(app).post('/api/orders/quote').send({ items: order.items, delivery: 'standard' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ subtotal: 122, discount: 10, shipping: 0, total: 112 });
    expect(res.body.lines).toHaveLength(3);
    expect(res.body.rates).toEqual({ discountThreshold: 100, discountAmount: 10, expressShipping: 14.99 });
  });
  test('adds express shipping', async () => {
    const res = await request(app).post('/api/orders/quote').send({ items: [{ productId: 2, quantity: 1 }], delivery: 'express' });
    expect(res.body.total).toBe(43.99);
  });
  test('400 for an empty cart', async () => {
    const res = await request(app).post('/api/orders/quote').send({ items: [], delivery: 'standard' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/orders (checkout)', () => {
  test('charges the real total and saves the order', async () => {
    gateway.charge.mockResolvedValue({ approved: true, reference: 'PAY-ABCD1234' });
    repo.createOrder.mockResolvedValue('QC-2026-10003');

    const res = await request(app).post('/api/orders').send(order);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ orderNumber: 'QC-2026-10003', total: 112, paymentReference: 'PAY-ABCD1234' });
    expect(gateway.charge).toHaveBeenCalledWith({ method: 'card', amountCents: 11200, card: order.payment.card });
    expect(repo.createOrder).toHaveBeenCalledTimes(1);
  });

  test('a declined card gives 402 and nothing is saved', async () => {
    gateway.charge.mockResolvedValue({ approved: false, reason: 'Your card was declined. Please try another card.' });
    const res = await request(app).post('/api/orders').send(order);
    expect(res.status).toBe(402);
    expect(res.body.error).toMatch(/declined/);
    expect(repo.createOrder).not.toHaveBeenCalled();
  });

  test('payment service down gives 502 and nothing is saved', async () => {
    gateway.charge.mockRejectedValue(new Error('Payment service unavailable'));
    const res = await request(app).post('/api/orders').send(order);
    expect(res.status).toBe(502);
    expect(repo.createOrder).not.toHaveBeenCalled();
  });

  test('invalid input gives 400 and the card is never charged', async () => {
    const res = await request(app).post('/api/orders').send({ ...order, customer: { ...order.customer, email: 'bad' } });
    expect(res.status).toBe(400);
    expect(gateway.charge).not.toHaveBeenCalled();
  });

  test('unknown product gives 400', async () => {
    repo.getProductsByIds.mockResolvedValue([]);
    const res = await request(app).post('/api/orders').send(order);
    expect(res.status).toBe(400);
    expect(gateway.charge).not.toHaveBeenCalled();
  });

  test('asking for more than the stock gives 409', async () => {
    const res = await request(app).post('/api/orders').send({ ...order, items: [{ productId: 3, quantity: 5 }] });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Only 2 left/);
    expect(gateway.charge).not.toHaveBeenCalled();
  });

  test('stock that disappears during saving gives 409', async () => {
    gateway.charge.mockResolvedValue({ approved: true, reference: 'PAY-ABCD1234' });
    const err = new Error('Sorry, Double Stainless Flask Set just went out of stock');
    err.code = 'OUT_OF_STOCK';
    repo.createOrder.mockRejectedValue(err);
    const res = await request(app).post('/api/orders').send(order);
    expect(res.status).toBe(409);
  });

  test('a database failure gives 500 without leaking details', async () => {
    gateway.charge.mockResolvedValue({ approved: true, reference: 'PAY-ABCD1234' });
    repo.createOrder.mockRejectedValue(new Error('secret sql detail'));
    const res = await request(app).post('/api/orders').send(order);
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/secret/);
  });
});

describe('order history', () => {
  test('GET /api/orders needs a valid email', async () => {
    expect((await request(app).get('/api/orders')).status).toBe(400);
    expect((await request(app).get('/api/orders?email=nope')).status).toBe(400);
  });
  test('GET /api/orders?email= returns the customer and orders', async () => {
    repo.listOrdersByEmail.mockResolvedValue({ customer: null, orders: [] });
    const res = await request(app).get('/api/orders?email=john@example.com');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ customer: null, orders: [] });
  });
  test('GET /api/orders/:orderNumber is 404 when the order does not exist', async () => {
    repo.getOrderByNumber.mockResolvedValue(null);
    expect((await request(app).get('/api/orders/QC-2026-00000')).status).toBe(404);
  });
  test('GET /api/orders/:orderNumber returns the order', async () => {
    repo.getOrderByNumber.mockResolvedValue({ orderNumber: 'QC-2026-88219' });
    const res = await request(app).get('/api/orders/QC-2026-88219');
    expect(res.body.orderNumber).toBe('QC-2026-88219');
  });
});

describe('support tickets', () => {
  const ticket = { name: 'John', email: 'john@example.com', subject: 'Late order', message: 'Where is my order?' };
  test('creates a ticket', async () => {
    repo.createTicket.mockResolvedValue(7);
    const res = await request(app).post('/api/support/tickets').send(ticket);
    expect(res.status).toBe(201);
    expect(res.body.ticketId).toBe(7);
  });
  test('rejects an incomplete ticket', async () => {
    const res = await request(app).post('/api/support/tickets').send({ ...ticket, message: '' });
    expect(res.status).toBe(400);
  });
});
