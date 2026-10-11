const express = require('express');
const repo = require('./repo');
const { filterProducts, suggest, listCategories } = require('./catalog');

const app = express();
app.use(express.json());

// Health check (Docker HEALTHCHECK and Jenkins smoke test) - also checks the database
app.get(['/health', '/api/catalog/health'], async (req, res) => {
  try {
    await repo.ping();
    res.json({ status: 'ok', service: 'catalog-api' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'db-error' });
  }
});

// Product list, with optional ?q=search&category=Family&deals=1
app.get('/api/catalog/products', async (req, res) => {
  const products = await repo.listProducts();
  res.json(filterProducts(products, {
    q: req.query.q,
    category: req.query.category,
    deals: req.query.deals === '1',
  }));
});

// Smart search drop-down: GET /api/catalog/suggest?q=mat
app.get('/api/catalog/suggest', async (req, res) => {
  const products = await repo.listProducts();
  res.json(suggest(products, req.query.q));
});

app.get('/api/catalog/categories', async (req, res) => {
  res.json(listCategories(await repo.listProducts()));
});

app.get('/api/catalog/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid product id' });
  const product = await repo.getProduct(id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Express 5 passes errors from async routes here; details stay in the log
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  require('./migrate')().then(() => {
    app.listen(PORT, () => console.log(`catalog-api running on port ${PORT}`));
  }).catch(error => { console.error('Catalog migration failed:', error.message); process.exit(1); });
}

module.exports = app;
