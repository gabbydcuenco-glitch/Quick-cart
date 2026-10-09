import { useCallback, useEffect, useState } from 'react'
import { getProducts } from './api'
import { useApi } from './useApi'
import { CART_KEY, MAX_QTY, loadCart } from './format'
import Header from './components/Header'
import Footer from './components/Footer'
import Toast from './components/Toast'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductPage from './pages/ProductPage'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import Account from './pages/Account'
import About from './pages/About'
import Contact from './pages/Contact'

// The whole shop uses "#/page" addresses, so no router library is needed
function parseHash() {
  const hash = window.location.hash.slice(1) || '/'
  const [path, query = ''] = hash.split('?')
  return { path, params: new URLSearchParams(query) }
}

function useHashRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

const loadAllProducts = () => getProducts()

export default function App() {
  const { path, params } = useHashRoute()
  const { data: products, error: productsError } = useApi(loadAllProducts)
  const [cart, setCart] = useState(loadCart)
  const [toast, setToast] = useState(null)
  const closeToast = useCallback(() => setToast(null), [])

  // the cart survives a page refresh
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  const limitFor = (id) => {
    const product = (products || []).find((p) => p.id === id)
    return Math.min(MAX_QTY, product ? product.stock : MAX_QTY)
  }

  const addToCart = (product, quantity = 1) => {
    const limit = Math.min(MAX_QTY, product.stock)
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: Math.min(limit, i.quantity + quantity) } : i))
      }
      return [...prev, { id: product.id, quantity: Math.min(limit, quantity) }]
    })
    setToast({
      type: 'success',
      title: 'Success!',
      message: `${product.name} was added to your cart.`,
      actionLabel: 'View Cart',
      onAction: () => { window.location.hash = '#/cart' },
    })
  }

  const setQuantity = (id, quantity) => {
    if (quantity < 1) return removeItem(id)
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(limitFor(id), quantity) } : i)))
  }
  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id))
  const clearCart = () => setCart([])

  const onOrdered = (orderNumber) => {
    setCart([])
    window.location.hash = `#/order/${orderNumber}`
  }

  const categories = [...new Set((products || []).map((p) => p.category))].sort()
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  let page
  if (path === '/') page = <Home products={products} error={productsError} addToCart={addToCart} />
  else if (path === '/shop') page = <Shop params={params} categories={categories} addToCart={addToCart} />
  else if (path.startsWith('/product/')) page = <ProductPage key={path} id={Number(path.split('/')[2])} addToCart={addToCart} />
  else if (path === '/cart') page = <Cart cart={cart} products={products} setQuantity={setQuantity} removeItem={removeItem} clearCart={clearCart} />
  else if (path === '/checkout') page = <Checkout cart={cart} onOrdered={onOrdered} showToast={setToast} />
  else if (path.startsWith('/order/')) page = <Confirmation orderNumber={decodeURIComponent(path.split('/')[2] || '')} />
  else if (path === '/account') page = <Account />
  else if (path === '/about') page = <About />
  else if (path === '/contact') page = <Contact />
  else page = <section className="section"><h1 className="page-title">Page not found</h1><a className="btn btn-crimson" href="#/">Back to home</a></section>

  return (
    <div className="app">
      <Header cartCount={cartCount} categories={categories} path={path} />
      <main className="main">{page}</main>
      <Footer />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  )
}
