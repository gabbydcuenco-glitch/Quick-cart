// All SQL of order-api lives here
const pool = require('./db');
const { estimate, transition } = require('./tracking');
const { formatOrderNumber, dollars, toCents } = require('./logic');

async function ping() {
  await pool.query('SELECT 1');
}

// Current prices and stock for the cart (prices always come from the database, never from the browser)
async function getProductsByIds(ids) {
  const { rows } = await pool.query(
    'SELECT product_id, name, price, stock FROM products WHERE product_id = ANY($1::int[])',
    [ids]
  );
  return rows.map((r) => ({ id: r.product_id, name: r.name, priceCents: toCents(r.price), stock: r.stock }));
}

// Everything happens in ONE transaction: if any step fails, nothing is saved.
async function createOrder({ customer, saveAddress, delivery, lines, totals, payment }) {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');

    // 1. Take the stock. The "AND stock >= $3" makes this safe even if two people buy at once.
    for (const line of lines) {
      const res = await conn.query(
        'UPDATE products SET stock = stock - $1 WHERE product_id = $2 AND stock >= $3',
        [line.quantity, line.productId, line.quantity]
      );
      if (res.rowCount !== 1) {
        const err = new Error(`Sorry, ${line.name} just went out of stock`);
        err.code = 'OUT_OF_STOCK';
        throw err;
      }
    }

    // 2. Find or create the customer (the address is saved only if the customer asked for it)
    const email = customer.email.trim().toLowerCase();
    const { rows: customers } = await conn.query(
      'INSERT INTO customers (email, full_name, phone) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone RETURNING customer_id',
      [email, customer.fullName.trim(), customer.phone.trim()]
    );
    const customerId = customers[0].customer_id;
    if (saveAddress) {
      await conn.query('UPDATE customers SET street = $1, city = $2, state = $3, zip = $4 WHERE customer_id = $5',
        [customer.street.trim(), customer.city.trim(), customer.state.trim(), customer.zip.trim(), customerId]);
    }

    // 3. The order itself (the shipping address is copied into the order)
    const { rows: order } = await conn.query(
      `INSERT INTO orders (customer_id, delivery_method, subtotal, discount, shipping, total, payment_method, payment_reference,
                           ship_name, ship_street, ship_city, ship_state, ship_zip, ship_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING order_id`,
      [customerId, delivery, dollars(totals.subtotalCents), dollars(totals.discountCents), dollars(totals.shippingCents),
       dollars(totals.totalCents), payment.method, payment.reference,
       customer.fullName.trim(), customer.street.trim(), customer.city.trim(), customer.state.trim(),
       customer.zip.trim(), customer.phone.trim()]
    );
    const orderNumber = formatOrderNumber(order[0].order_id);
    await conn.query('UPDATE orders SET order_number = $1 WHERE order_id = $2', [orderNumber, order[0].order_id]);

    const eta = estimate(delivery);
    await conn.query('UPDATE orders SET estimated_start=$1, estimated_end=$2 WHERE order_id=$3', [eta.start, eta.end, order[0].order_id]);
    await conn.query('INSERT INTO delivery_events(order_id, status, note) VALUES ($1, $2, $3)', [order[0].order_id, 'Processing', 'Order placed. Preparing your items.']);

    // 4. The items and the activity log
    for (const line of lines) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES ($1, $2, $3, $4, $5)',
        [order[0].order_id, line.productId, line.name, dollars(line.unitPriceCents), line.quantity]
      );
    }
    await conn.query('INSERT INTO activity_logs (order_id, action_type, info) VALUES ($1, $2, $3)',
      [order[0].order_id, 'ORDER_PLACED', `Order ${orderNumber} placed, total ${dollars(totals.totalCents).toFixed(2)}`]);

    await conn.query('COMMIT');
    return orderNumber;
  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}

function toOrder(row, items, events) {
  return {
    orderNumber: row.order_number,
    status: row.status,
    createdAt: row.created_at,
    deliveryMethod: row.delivery_method,
    tracking: {
      simulated: true,
      demoControls: process.env.DELIVERY_DEMO === 'true',
      estimatedStart: row.estimated_start, estimatedEnd: row.estimated_end,
      receivedAt: row.received_at,
      destination: [row.ship_city, row.ship_state].filter(Boolean).join(', '),
      events: events.map(e => ({ status: e.status, at: e.occurred_at, note: e.note })),
    },
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    shipping: Number(row.shipping),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    items: items.map((i) => ({ productId: i.product_id, name: i.product_name, unitPrice: Number(i.unit_price), quantity: i.quantity })),
  };
}

async function attachItems(rows) {
  if (rows.length === 0) return [];
  const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY item_id', [rows.map((r) => r.order_id)]);
  const { rows: events } = await pool.query('SELECT * FROM delivery_events WHERE order_id = ANY($1::int[]) ORDER BY event_id', [rows.map(r => r.order_id)]);
  return rows.map((row) => toOrder(row, items.filter((i) => i.order_id === row.order_id), events.filter(e => e.order_id === row.order_id)));
}

// My Account: the customer (with the saved address, if any) and all of their orders
async function listOrdersByEmail(email) {
  const clean = email.trim().toLowerCase();
  const { rows: customers } = await pool.query('SELECT * FROM customers WHERE email = $1', [clean]);
  if (customers.length === 0) return { customer: null, orders: [] };
  const c = customers[0];
  const { rows } = await pool.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY order_id DESC', [c.customer_id]);
  return {
    customer: {
      email: c.email,
      fullName: c.full_name,
      phone: c.phone,
      address: c.street ? { street: c.street, city: c.city, state: c.state, zip: c.zip } : null,
    },
    orders: await attachItems(rows),
  };
}

async function getOrderByNumber(orderNumber) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber]);
  if (rows.length === 0) return null;
  return (await attachItems(rows))[0];
}

async function createTicket({ name, email, subject, message }) {
  const { rows: res } = await pool.query(
    'INSERT INTO support_tickets (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING ticket_id',
    [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()]
  );
  await pool.query('INSERT INTO activity_logs (order_id, action_type, info) VALUES (NULL, $1, $2)',
    ['TICKET_CREATED', `Support ticket #${res[0].ticket_id}: ${subject.trim()}`]);
  return res[0].ticket_id;
}

async function updateDelivery(orderNumber, action, expectedStatus) {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    const { rows } = await conn.query('SELECT order_id, status FROM orders WHERE order_number=$1 FOR UPDATE', [orderNumber]);
    if (!rows.length) { const error = new Error('Order not found'); error.status = 404; throw error; }
    const row = rows[0];
    // Repeated receipt confirmation is harmless; concurrent advances cannot skip a stage.
    if (!(action === 'receive' && row.status === 'Delivered')) {
      if (row.status !== expectedStatus) { const error = new Error('Order changed. Refresh before updating.'); error.status = 409; throw error; }
      const status = transition(row.status, action);
      await conn.query("UPDATE orders SET status=$1, received_at=CASE WHEN $1='Delivered' THEN CURRENT_TIMESTAMP ELSE received_at END WHERE order_id=$2", [status, row.order_id]);
      const note = action === 'receive' ? 'Customer confirmed receipt.' : 'Demo delivery advanced to ' + status + '.';
      await conn.query('INSERT INTO delivery_events(order_id,status,note) VALUES($1,$2,$3)', [row.order_id,status,note]);
      await conn.query('INSERT INTO activity_logs(order_id,action_type,info) VALUES($1,$2,$3)', [row.order_id,'DELIVERY_UPDATED',note]);
    }
    await conn.query('COMMIT');
  } catch (error) { await conn.query('ROLLBACK'); throw error; }
  finally { conn.release(); }
  return getOrderByNumber(orderNumber);
}

module.exports = { updateDelivery, ping, getProductsByIds, createOrder, listOrdersByEmail, getOrderByNumber, createTicket };

