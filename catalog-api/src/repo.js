// All SQL of catalog-api lives here (read-only access to the products table)
const pool = require('./db');
const { discountPercent } = require('./catalog');

function toProduct(row) {
  const price = Number(row.price);
  const listPrice = row.list_price === null ? null : Number(row.list_price);
  return {
    id: row.product_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    productType: row.product_type || null,
    currency: row.currency || 'USD',
    price,
    listPrice,
    discountPercent: discountPercent(price, listPrice),
    rating: Number(row.rating),
    reviews: row.reviews,
    stock: row.stock,
  };
}

async function ping() {
  await pool.query('SELECT 1');
}

async function listProducts() {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY product_id');
  return rows.map(toProduct);
}

async function getProduct(id) {
  const { rows } = await pool.query('SELECT * FROM products WHERE product_id = $1', [id]);
  return rows.length ? toProduct(rows[0]) : null;
}

module.exports = { ping, listProducts, getProduct, toProduct };

