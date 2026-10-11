import { money, stars } from '../format'
import ProductImage from './ProductImage'

export default function ProductCard({ product, onAdd }) {
  const soldOut = product.stock === 0
  return (
    <article className="product-card">
      {product.discountPercent > 0 && <span className="badge-discount">-{product.discountPercent}% OFF</span>}
      <a className="product-card-link" href={`#/product/${product.id}`}>
        <ProductImage slug={product.slug} />
        <h3>{product.name}</h3>
      </a>
      <p className="product-category">{product.category}</p>
      {product.reviews > 0 ? (
        <p className="rating" aria-label={`Rated ${product.rating} out of 5`}>
          <span className="stars">{stars(product.rating)}</span> ({product.reviews})
        </p>
      ) : <p className="rating">New arrival · No reviews yet</p>}
      <p className="price">
        <strong>{money(product.price, product.currency || 'USD')}</strong>
        {product.listPrice && product.listPrice > product.price && <s>{money(product.listPrice, product.currency || 'USD')}</s>}
      </p>
      {!soldOut && product.stock <= 5 && <p className="low-stock">Only {product.stock} left</p>}
      <button type="button" className="btn btn-gold btn-block" disabled={soldOut} onClick={() => onAdd(product, 1)}>
        {soldOut ? 'Sold out' : 'Quick Add'}
      </button>
    </article>
  )
}
