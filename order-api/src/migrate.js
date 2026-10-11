const pool = require('./db');
// Run before accepting traffic, including databases already stored in pg-data.
module.exports = async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(817204)');
    // Existing orders retain USD; all new orders explicitly use PHP.
    await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD'");
    await client.query("ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'PHP'");
    await client.query(`ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS estimated_start TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS estimated_end TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ`);
    await client.query(`CREATE TABLE IF NOT EXISTS delivery_events (
      event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      note TEXT NOT NULL
    )`);
    await client.query('CREATE INDEX IF NOT EXISTS delivery_events_order_idx ON delivery_events(order_id, event_id)');
    await client.query(`UPDATE orders SET
      estimated_start = (created_at AT TIME ZONE 'UTC') + CASE WHEN delivery_method = 'express' THEN INTERVAL '1 day' ELSE INTERVAL '3 days' END,
      estimated_end = (created_at AT TIME ZONE 'UTC') + CASE WHEN delivery_method = 'express' THEN INTERVAL '1 day 4 hours' ELSE INTERVAL '3 days 4 hours' END
      WHERE estimated_start IS NULL`);
    // Existing records keep their status; do not invent historical delivery timestamps.
    await client.query(`INSERT INTO delivery_events(order_id, status, note)
      SELECT o.order_id, o.status, 'Existing order imported; earlier delivery times are unavailable.'
      FROM orders o WHERE NOT EXISTS (SELECT 1 FROM delivery_events e WHERE e.order_id=o.order_id)`);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
};
