import ProductCard from '../components/ProductCard'

export default function Home({ products, error, addToCart }) {
  // featured = the products with the biggest discount first
  const featured = [...(products || [])].sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 4)
  const categories = [...new Set((products || []).map((p) => p.category))]

  return (
    <>
      <section className="hero">
        <p className="hero-kicker">Festive Season Sale</p>
        <h1 className="hero-logo-heading"><img className="hero-logo" src="/images/together-and-gifts.png" alt="Together & Gifts" width="2048" height="360" /></h1>
        <p>Thoughtful gifts for Men, Women, Unisex, and Couples — from everyday essentials to memories made together.</p>
        <a className="btn btn-gold" href="#/shop?deals=1">Shop Holiday Deals</a>
      </section>

      <section className="trust-strip" aria-label="Why shop with us">
        <p>🚚 <strong>Free</strong> standard shipping</p>
        <p>↩️ <strong>30-day</strong> holiday returns</p>
        <p>🔒 <strong>Secure</strong> checkout</p>
      </section>

      <section className="section">
        <h2 className="section-title">Featured Holiday Picks</h2>
        {error && <p className="notice notice-error">We could not load the products right now. Please try again later.</p>}
        {!products && !error && <p className="notice">Loading products...</p>}
        <div className="product-grid">
          {featured.map((p) => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="section">
          <h2 className="section-title">Shop by Category</h2>
          <ul className="chip-row">
            {categories.map((c) => (
              <li key={c}><a className="chip" href={`#/shop?category=${encodeURIComponent(c)}`}>{c}</a></li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
