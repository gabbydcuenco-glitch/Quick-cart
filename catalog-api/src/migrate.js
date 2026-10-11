const gifts = require('./gift-products.json');

// Explicit demo peso prices for the original products, not a live FX conversion.
const legacyPrices = [
  ['matching-couple-pjs', 2499, 3499, 'Couples', 'Couples Matching Pajama Set'],
  ['instant-film-camera-set', 3499, null],
  ['double-flask-set', 999, null, 'Couples', 'Couples Stainless Flask Set'],
  ['family-matching-pajamas', 3999, 4999],
  ['holiday-matching-shirts', 1199, null],
  ['gourmet-night-basket', 1499, null],
  ['pine-scented-candle-set', 899, 1199],
  ['gold-ornament-set', 1099, null],
  ['plaid-throw-blanket', 1699, 2249],
];

module.exports = async function migrate(pool = require('./db')) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(817204)');
    await client.query('CREATE TABLE IF NOT EXISTS catalog_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const applied = await client.query('SELECT version FROM catalog_migrations WHERE version=$1', ['20261010-gifts-php']);
    if (!applied.rows.length) {
      await client.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD', ADD COLUMN IF NOT EXISTS product_type VARCHAR(60)");
      await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD'");
      for (const [slug, price, listPrice, category, name] of legacyPrices) {
        await client.query("UPDATE products SET price=$2, list_price=$3, currency='PHP', category=COALESCE($4,category), name=COALESCE($5,name) WHERE slug=$1 AND currency='USD'",
          [slug, price, listPrice, category || null, name || null]);
      }
      const unsupported = await client.query("SELECT slug FROM products WHERE currency <> 'PHP'");
      if (unsupported.rows.length) throw new Error('Set peso prices for custom products before applying this catalog update: ' + unsupported.rows.map(p => p.slug).join(', '));
      await client.query("ALTER TABLE products ALTER COLUMN currency SET DEFAULT 'PHP'");
      await client.query("ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'PHP'");
      for (const gift of gifts) {
        await client.query(`INSERT INTO products (slug,name,description,category,product_type,price,list_price,rating,reviews,stock,currency)
          VALUES ($1,$2,$3,$4,$5,$6,NULL,0,0,$7,'PHP') ON CONFLICT (slug) DO NOTHING`,
          [gift.slug,gift.name,gift.description,gift.category,gift.productType,gift.price,gift.stock]);
      }
      await client.query('INSERT INTO catalog_migrations(version) VALUES($1)', ['20261010-gifts-php']);
    }
    // Shop catalog refresh: the store sells exactly the products in shop-products.json, in that order.
    // Prices in that file are the storefront's USD figures; they are stored in pesos because checkout is peso-only.
    // Set PHP_PER_USD to 1 to show the same numbers as the screenshot.
    const shopApplied = await client.query('SELECT version FROM catalog_migrations WHERE version=$1', ['20261011-shop-catalog']);
    if (!shopApplied.rows.length) {
      const PHP_PER_USD = 56;
      const shop = require('./shop-products.json');
      const existing = (await client.query('SELECT product_id FROM products ORDER BY product_id')).rows;
      await client.query("UPDATE products SET slug='tmp-' || product_id");
      for (let i = 0; i < shop.length; i++) {
        const g = shop[i];
        const price = Math.round(g.priceUsd * PHP_PER_USD);
        const listPrice = g.listPriceUsd ? Math.round(g.listPriceUsd * PHP_PER_USD) : null;
        if (existing[i]) {
          await client.query(`UPDATE products SET slug=$2,name=$3,description=$4,category=$5,product_type=$6,price=$7,list_price=$8,rating=$9,reviews=$10,stock=$11,currency='PHP' WHERE product_id=$1`,
            [existing[i].product_id, g.slug, g.name, g.description, g.category, g.productType, price, listPrice, g.rating, g.reviews, g.stock]);
        } else {
          await client.query(`INSERT INTO products (slug,name,description,category,product_type,price,list_price,rating,reviews,stock,currency)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PHP')`,
            [g.slug, g.name, g.description, g.category, g.productType, price, listPrice, g.rating, g.reviews, g.stock]);
        }
      }
      // Remove leftover old products; any that already appear in an order are kept but marked sold out.
      await client.query("UPDATE products SET stock=0 WHERE slug LIKE 'tmp-%' AND product_id IN (SELECT product_id FROM order_items)");
      await client.query("DELETE FROM products WHERE slug LIKE 'tmp-%' AND product_id NOT IN (SELECT product_id FROM order_items)");
      await client.query('INSERT INTO catalog_migrations(version) VALUES($1)', ['20261011-shop-catalog']);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
};
