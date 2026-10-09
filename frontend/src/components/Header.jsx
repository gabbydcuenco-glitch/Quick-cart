import { useEffect, useState } from 'react'
import { getSuggestions } from '../api'
import { money } from '../format'
import ProductImage from './ProductImage'

function Highlight({ text, query }) {
  const start = text.toLowerCase().indexOf(query.toLowerCase())
  if (start < 0) return text
  const end = start + query.length
  return (
    <>
      {text.slice(0, start)}
      <strong>{text.slice(start, end)}</strong>
      {text.slice(end)}
    </>
  )
}

const NAV = [
  { label: 'Home', href: '#/', path: '/' },
  { label: 'Shop', href: '#/shop', path: '/shop' },
]

export default function Header({ cartCount, categories, path }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [found, setFound] = useState({ q: '', list: [] })
  const query = text.trim()

  // Smart search: wait 250 ms after the last key press, then ask catalog-api
  useEffect(() => {
    if (query.length < 2) return undefined
    let active = true
    const timer = setTimeout(() => {
      getSuggestions(query)
        .then((list) => active && setFound({ q: query, list }))
        .catch(() => active && setFound({ q: query, list: [] }))
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  const showList = open && query.length >= 2 && found.q === query && found.list.length > 0

  const submit = (event) => {
    event.preventDefault()
    if (!query) return
    setOpen(false)
    window.location.hash = `#/shop?q=${encodeURIComponent(query)}`
  }

  return (
    <header className="site-header">
      <div className="header-main">
        <a className="logo" href="#/" aria-label="QuickCart home">
          <span className="logo-icon" aria-hidden="true">🛒</span>
          <span className="logo-text">QuickCart<small>Joy Delivered</small></span>
        </a>

        <form className="search" role="search" onSubmit={submit}>
          <input
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
            value={text}
            onChange={(e) => { setText(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          />
          <button type="submit" aria-label="Search">🔍</button>
          {showList && (
            <ul className="suggestions" onMouseDown={(e) => e.preventDefault()}>
              {found.list.map((item) => (
                <li key={item.id}>
                  <a href={`#/product/${item.id}`} onClick={() => setOpen(false)}>
                    <ProductImage slug={item.slug} />
                    <span className="suggestion-name"><Highlight text={item.name} query={query} /></span>
                    <span className="suggestion-price">{money(item.price)}</span>
                  </a>
                </li>
              ))}
              <li className="suggestions-hint">Press Enter to search all “{query}” items</li>
            </ul>
          )}
        </form>

        <nav className="header-actions" aria-label="Account and cart">
          <a href="#/account" aria-label="My Account">👤 <span>My Account</span></a>
          <a href="#/cart" className="cart-link" aria-label={`Cart, ${cartCount} items`}>
            🛍️ <span>Cart</span>
            {cartCount > 0 && <span className="cart-badge" aria-hidden="true">{cartCount}</span>}
          </a>
        </nav>
      </div>

      <nav className="main-nav" aria-label="Main">
        <ul>
          {NAV.map((item) => (
            <li key={item.path}>
              <a href={item.href} aria-current={path === item.path ? 'page' : undefined}>{item.label}</a>
            </li>
          ))}
          <li>
            {/* key = current page, so the menu closes after you pick a category */}
            <details className="nav-dropdown" key={path}>
              <summary>Categories</summary>
              <ul>
                {categories.map((c) => (
                  <li key={c}><a href={`#/shop?category=${encodeURIComponent(c)}`}>{c}</a></li>
                ))}
              </ul>
            </details>
          </li>
          <li><a href="#/shop?deals=1" className="nav-deals">Holiday Deals</a></li>
          <li><a href="#/about" aria-current={path === '/about' ? 'page' : undefined}>About Us</a></li>
          <li><a href="#/contact" aria-current={path === '/contact' ? 'page' : undefined}>Contact</a></li>
        </ul>
      </nav>
      <div className="pine-border" aria-hidden="true" />
    </header>
  )
}
