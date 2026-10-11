// Real PostgreSQL engine (PGlite), isolated from the user's Docker database.
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
let db;
async function run() {
  db = new PGlite();
  const query = (sql, params) => db.query(sql, params);
  const pool = { query, connect: async () => ({ query, release() {} }) };
  // The repository and migration execute their actual SQL, not mocked query results.
  require.cache[require.resolve('../src/db')] = { exports: pool };
  const migrate = require('../src/migrate');
  const repo = require('../src/repo');
  await db.exec(`
    CREATE TABLE orders(order_id INTEGER PRIMARY KEY, order_number VARCHAR(20),
      status VARCHAR(20) NOT NULL DEFAULT 'Processing', delivery_method VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, subtotal NUMERIC DEFAULT 1,
      discount NUMERIC DEFAULT 0, shipping NUMERIC DEFAULT 0, total NUMERIC DEFAULT 1);
    CREATE TABLE order_items(item_id INTEGER, order_id INTEGER, product_id INTEGER,
      product_name TEXT, unit_price NUMERIC, quantity INTEGER);
    CREATE TABLE activity_logs(order_id INTEGER, action_type VARCHAR(50), info TEXT);
    INSERT INTO orders(order_id,order_number,delivery_method) VALUES(1,'QA-1','standard');
    INSERT INTO order_items VALUES(1,1,1,'TEST',1,1);
  `);
  await migrate(); await migrate();
  let order = await repo.getOrderByNumber('QA-1');
  assert.equal(order.tracking.events.length, 1, 'migration must not duplicate import events');
  assert.ok(order.tracking.estimatedStart);
  await assert.rejects(repo.updateDelivery('QA-1','receive','Processing'), { status: 409 });
  order = await repo.updateDelivery('QA-1','advance','Processing');
  assert.equal(order.status,'Shipped');
  await assert.rejects(repo.updateDelivery('QA-1','advance','Processing'), { status: 409 });
  order = await repo.updateDelivery('QA-1','advance','Shipped');
  assert.equal(order.status,'Out for Delivery');
  order = await repo.updateDelivery('QA-1','receive','Out for Delivery');
  assert.equal(order.status,'Delivered');
  assert.ok(order.tracking.receivedAt);
  const received = new Date(order.tracking.receivedAt).toISOString();
  order = await repo.updateDelivery('QA-1','receive','Out for Delivery');
  assert.equal(order.tracking.events.length,4);
  assert.equal(new Date(order.tracking.receivedAt).toISOString(),received);
  console.log('PASS PostgreSQL integration: migration twice, transition SQL, invalid/stale actions, receipt idempotency, persisted re-read');
}
run().catch(error => { console.error(error); process.exitCode=1; }).finally(async () => {
  if (db) await db.close();
});
