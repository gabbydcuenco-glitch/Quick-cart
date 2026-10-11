// Execute the actual catalog and order migrations in an isolated PostgreSQL engine.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const migrateCatalog = require('../../catalog-api/src/migrate');
const gifts = require('../../catalog-api/src/gift-products.json');
let db;

async function run() {
  db = new PGlite();
  const query = (sql, params) => db.query(sql, params);
  const pool = { query, connect: async () => ({ query, release() {} }) };
  require.cache[require.resolve('../src/db')] = { exports: pool };
  require.cache[require.resolve('../../catalog-api/src/db')] = { exports: pool };
  const migrateOrders = require('../src/migrate');
  const repo = require('../src/repo');
  const { calculateTotals } = require('../src/logic');
  await db.exec(readFileSync(resolve(__dirname, '../../db/init.sql'), 'utf8'));
  const oldOrders = (await query('SELECT order_number,total FROM orders ORDER BY order_id')).rows;
  await migrateOrders();
  await migrateCatalog(pool);
  await migrateCatalog(pool);
  await migrateOrders();
  const rows = (await query('SELECT * FROM products')).rows;
  assert.equal(rows.length, 45);
  assert.equal(new Set(rows.map(p => p.slug)).size, 45);
  for (const category of ['Gifts for Men','Gifts for Women','Unisex']) {
    assert.equal(rows.filter(p => p.category === category).length, 10);
  }
  assert.equal(rows.filter(p => p.category === 'Couples').length, 8);
  for (const gift of gifts) {
    const actual = rows.find(p => p.slug === gift.slug);
    assert.equal(actual.name, gift.name);
    assert.equal(actual.currency, 'PHP');
    assert.equal(Number(actual.price), gift.price);
    assert.ok(gift.price >= gift.sourcePriceMin && gift.price <= gift.sourcePriceMax);
  }
  assert.ok(rows.every(p => p.currency === 'PHP'));
  assert.deepEqual((await query('SELECT order_number,total FROM orders ORDER BY order_id')).rows, oldOrders);
  const oldOrder = await repo.getOrderByNumber(oldOrders[0].order_number);
  assert.equal(oldOrder.currency, 'USD');
  assert.equal(oldOrder.total, Number(oldOrders[0].total));

  const product = rows.find(p => p.slug === 'couples-matching-bracelets');
  const [priced] = await repo.getProductsByIds([product.product_id]);
  assert.equal(priced.currency, 'PHP');
  const lines = [{ productId: priced.id, name: priced.name, unitPriceCents: priced.priceCents, quantity: 3 }];
  const totals = calculateTotals(lines, 'express');
  assert.equal(totals.totalCents, 420000 - 30000 + 14900);
  const number = await repo.createOrder({
    customer: { email:'qa-gifts@example.test',fullName:'Gift QA',phone:'09170000000',
      street:'Test Street',city:'Test City',state:'Test Province',zip:'1000' },
    saveAddress: false, delivery:'express',lines,totals,
    payment:{ method:'card',reference:'PAY-TEST-PHP' },
  });
  const saved = await repo.getOrderByNumber(number);
  assert.equal(saved.currency, 'PHP');
  assert.equal(saved.total, totals.totalCents / 100);
  assert.equal(saved.items[0].quantity, 3);
  assert.equal(saved.items[0].unitPrice, Number(product.price));
  await migrateCatalog(pool);
  const [after] = await repo.getProductsByIds([product.product_id]);
  assert.equal(after.stock, product.stock - 3, 'rerunning migration must never reset stock');
  assert.equal((await query('SELECT count(*)::int AS count FROM products')).rows[0].count,45);
  const request = require('supertest');
  const catalogApp = require('../../catalog-api/src/server');
  const orderApp = require('../src/server');
  const listing = await request(catalogApp).get('/api/catalog/products');
  assert.equal(listing.status, 200);
  assert.equal(listing.body.length, 45);
  assert.ok(listing.body.every(p => p.currency === 'PHP'));
  const couples = await request(catalogApp).get('/api/catalog/products').query({ category:'Couples' });
  assert.equal(couples.body.length, 8);
  const legacyCouples = await request(catalogApp).get('/api/catalog/products').query({ category:'Couples & Unisex' });
  assert.equal(legacyCouples.status, 200);
  assert.deepEqual(legacyCouples.body, couples.body, 'saved legacy Couples links must still return products');
  const suggestions = await request(catalogApp).get('/api/catalog/suggest?q=bracelet');
  assert.equal(suggestions.body[0].currency, 'PHP');
  const quote = await request(orderApp).post('/api/orders/quote')
    .send({ items:[{productId:product.product_id,quantity:3}], delivery:'express' });
  assert.equal(quote.status, 200);
  assert.equal(quote.body.currency, 'PHP');
  assert.equal(quote.body.total, totals.totalCents / 100);
  const history = await request(orderApp).get('/api/orders/' + oldOrders[0].order_number);
  assert.equal(history.body.currency, 'USD');
  console.log('PASS gifts PostgreSQL integration: 30 source gifts + 6 Couples sets, 45 products, PHP checkout, original USD history, repeat migration and stock preservation');
}
run().catch(error => { console.error(error); process.exitCode=1; }).finally(async () => { if (db) await db.close(); });
