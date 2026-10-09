export const BUILD = import.meta.env.VITE_BUILD_NUMBER || 'dev'
export const MAX_QTY = 10

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const money = (amount) => usd.format(amount)

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function stars(rating) {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

// Products have no photos yet, so each one gets a festive icon on a colored background (CSS only)
const LOOKS = {
  'matching-couple-pjs': { icon: '🛌', tint: 'red' },
  'instant-film-camera-set': { icon: '📷', tint: 'gold' },
  'double-flask-set': { icon: '☕', tint: 'pine' },
  'family-matching-pajamas': { icon: '🎅', tint: 'red' },
  'holiday-matching-shirts': { icon: '👕', tint: 'cream' },
  'gourmet-night-basket': { icon: '🧺', tint: 'gold' },
  'pine-scented-candle-set': { icon: '🕯️', tint: 'pine' },
  'gold-ornament-set': { icon: '🔔', tint: 'gold' },
  'plaid-throw-blanket': { icon: '🧣', tint: 'red' },
}
export const productLook = (slug) => LOOKS[slug] || { icon: '🎁', tint: 'gold' }

export const CART_KEY = 'quickcart-cart'
export const EMAIL_KEY = 'quickcart-email'

export function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    return saved.filter((i) => Number.isInteger(i.id) && Number.isInteger(i.quantity) && i.quantity > 0)
  } catch {
    return []
  }
}

export const toItems = (cart) => cart.map((i) => ({ productId: i.id, quantity: i.quantity }))

export const deliveryTime = value => value ? new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }) + ' PHT' : 'Not recorded'
