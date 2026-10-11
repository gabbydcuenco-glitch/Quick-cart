import { useCallback } from 'react'
import { getProducts } from '../api'
import { useApi } from '../useApi'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'

export default function Shop({ params, categories, addToCart }) {
  const q = params.get('q') || ''
  const requestedCategory = params.get('category') || ''
  const category = requestedCategory === 'Couples & Unisex' ? 'Couples' : requestedCategory
  const deals = params.get('deals') === '1'

  const loader = useCallback(() => {
    const query = {}
    if (q) query.q = q
    if (category) query.category = category
    if (deals) query.deals = '1'
    return getProducts(query)
  }, [q, category, deals])
  const { data: items, error, loading } = useApi(loader)

  const title = q ? `Search results for “${q}”` : deals ? 'Holiday Deals' : category || 'Shop All Gifts'
  const crumbs = [{ label: 'Home', href: '#/' }, { label: 'Shop', href: '#/shop' }]
  if (category) crumbs.push({ label: category })

  return (
    <section className="section">
      <Breadcrumbs items={crumbs} />
      <h1 className="page-title">{title}</h1>
      {items && <p className="hint">{items.length} gifts to explore</p>}

      <ul className="chip-row" aria-label="Filter products">
        <li><a className={`chip${!category && !deals && !q ? ' chip-active' : ''}`} href="#/shop">All</a></li>
        <li><a className={`chip${deals ? ' chip-active' : ''}`} href="#/shop?deals=1">Holiday Deals</a></li>
        {categories.map((c) => (
          <li key={c}>
            <a className={`chip${category === c ? ' chip-active' : ''}`} href={`#/shop?category=${encodeURIComponent(c)}`}>{c}</a>
          </li>
        ))}
      </ul>

      {error && <p className="notice notice-error">{error}</p>}
      {loading && <p className="notice">Loading products...</p>}
      {items && items.length === 0 && (
        <p className="notice">No products match your search. <a href="#/shop">See all gifts</a></p>
      )}
      {items && (
        <div className="product-grid">
          {items.map((p) => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
        </div>
      )}
    </section>
  )
}
