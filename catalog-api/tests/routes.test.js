const request = require('supertest');

// The database layer is replaced by a fake, so these tests need no MySQL
jest.mock('../src/repo', () => ({
  ping: jest.fn(),
  listProducts: jest.fn(),
  getProduct: jest.fn(),
}));
const repo = require('../src/repo');
const app = require('../src/server');

const sample = [
  { id: 1, slug: 'pjs', name: 'Matching Couple PJs', category: 'Couples & Unisex', price: 78, discountPercent: 30 },
  { id: 2, slug: 'camera', name: 'Instant Film Camera Set', category: 'Gifts', price: 29, discountPercent: 0 },
];

beforeEach(() => {
  jest.resetAllMocks();
  repo.listProducts.mockResolvedValue(sample);
});

test('GET /health is ok when the database answers', async () => {
  repo.ping.mockResolvedValue();
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});

test('GET /health is 500 when the database is down', async () => {
  repo.ping.mockRejectedValue(new Error('connection refused'));
  const res = await request(app).get('/api/catalog/health');
  expect(res.status).toBe(500);
  expect(res.body.status).toBe('db-error');
});

test('GET /api/catalog/products lists products', async () => {
  const res = await request(app).get('/api/catalog/products');
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(2);
});

test('GET /api/catalog/products?deals=1 keeps discounted products only', async () => {
  const res = await request(app).get('/api/catalog/products?deals=1');
  expect(res.body.map((p) => p.id)).toEqual([1]);
});

test('GET /api/catalog/suggest returns drop-down items', async () => {
  const res = await request(app).get('/api/catalog/suggest?q=cam');
  expect(res.body).toHaveLength(1);
  expect(res.body[0].name).toBe('Instant Film Camera Set');
});

test('GET /api/catalog/products/:id returns one product', async () => {
  repo.getProduct.mockResolvedValue(sample[0]);
  const res = await request(app).get('/api/catalog/products/1');
  expect(res.status).toBe(200);
  expect(res.body.slug).toBe('pjs');
});

test('GET /api/catalog/products/:id is 404 for an unknown product', async () => {
  repo.getProduct.mockResolvedValue(null);
  const res = await request(app).get('/api/catalog/products/99');
  expect(res.status).toBe(404);
});

test('GET /api/catalog/products/:id is 400 for a bad id', async () => {
  const res = await request(app).get('/api/catalog/products/abc');
  expect(res.status).toBe(400);
});

test('a database failure becomes a 500 without leaking details', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  repo.listProducts.mockRejectedValue(new Error('secret sql detail'));
  const res = await request(app).get('/api/catalog/products');
  expect(res.status).toBe(500);
  expect(JSON.stringify(res.body)).not.toMatch(/secret/);
});
