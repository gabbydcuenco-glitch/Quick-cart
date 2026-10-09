// Catalog rules (pure functions, unit-tested with Jest)

// "-30% OFF" badge: how much cheaper is the price than the original list price?
function discountPercent(price, listPrice) {
  if (!listPrice || listPrice <= price) return 0;
  return Math.round((1 - price / listPrice) * 100);
}

// Search box + category chips + "Holiday Deals" filter
function filterProducts(products, { q = '', category = '', deals = false } = {}) {
  const text = String(q).trim().toLowerCase();
  return products.filter((p) => {
    if (category && p.category !== category) return false;
    if (deals && p.discountPercent <= 0) return false;
    if (!text) return true;
    return p.name.toLowerCase().includes(text) || p.category.toLowerCase().includes(text);
  });
}

// Smart search: needs at least 2 letters, returns a few products for the drop-down
function suggest(products, query, limit = 5) {
  const text = String(query || '').trim().toLowerCase();
  if (text.length < 2) return [];
  return products
    .filter((p) => p.name.toLowerCase().includes(text) || p.category.toLowerCase().includes(text))
    .slice(0, limit)
    .map(({ id, slug, name, price, category }) => ({ id, slug, name, price, category }));
}

function listCategories(products) {
  return [...new Set(products.map((p) => p.category))].sort();
}

module.exports = { discountPercent, filterProducts, suggest, listCategories };
