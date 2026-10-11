import { useCallback, useState } from 'react'
import { getProduct } from '../api'
import { useApi } from '../useApi'
import { MAX_QTY, money, stars } from '../format'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductImage from '../components/ProductImage'

export default function ProductPage({ id, addToCart }) {
  const loader = useCallback(() => getProduct(id), [id])
  const { data: product, error, loading } = useApi(loader)
  const [quantity, setQuantity] = useState(1)

  if (loading) return <section className="section"><p className="notice">Loading product...</p></section>
  if (error || !product) {
    return (
      <section className="section">
        <p className="notice notice-error">{error || 'Product not found'}</p>
        <a className="btn btn-crimson" href="#/shop">Back to the shop</a>
      </section>
    )
  }

  const limit = Math.min(MAX_QTY, product.stock)
  const soldOut = product.stock === 0

  return (
    <section className="section">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '#/' },
          { label: 'Shop', href: '#/shop' },
          { label: product.category, href: `#/shop?category=${encodeURIComponent(product.category)}` },
          { label: product.name },
        ]}
      />
      <div className="product-detail">
        <div className="product-detail-image">
          {product.discountPercent > 0 && <span className="badge-discount">-{product.discountPercent}% OFF</span>}
          <ProductImage slug={product.slug} large />
        </div>
        <div className="product-detail-info">
          <p className="product-category">{product.category}</p>
          <h1 className="page-title">{product.name}</h1>
          {product.productType && <p className="hint">{product.productType}</p>}
          {product.reviews > 0
            ? <p className="rating"><span className="stars">{stars(product.rating)}</span> {product.rating} ({product.reviews} reviews)</p>
            : <p className="rating">New arrival · No reviews yet</p>}
          <p className="price price-large">
            <strong>{money(product.price, product.currency || 'USD')}</strong>
            {product.listPrice && product.listPrice > product.price && <s>{money(product.listPrice, product.currency || 'USD')}</s>}
          </p>
          <p>{product.description}</p>
          <p className={soldOut ? 'low-stock' : 'in-stock'}>
            {soldOut ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
          </p>

          {!soldOut && (
            <div className="buy-row">
              <label className="qty-label">
                Quantity
                <select value={Math.min(quantity, limit)} onChange={(e) => setQuantity(Number(e.target.value))}>
                  {Array.from({ length: limit }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button type="button" className="btn btn-gold" onClick={() => addToCart(product, Math.min(quantity, limit))}>
                Add to Cart
              </button>
            </div>
          )}

          <ul className="perk-list">
            <li>🚚 Free standard holiday shipping (Dec 20–24)</li>
            <li>↩️ 30-day holiday return guarantee</li>
            <li>🔒 Secure checkout</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
