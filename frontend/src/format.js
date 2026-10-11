export const BUILD = import.meta.env.VITE_BUILD_NUMBER || 'dev'
export const MAX_QTY = 10

const currencies = {
  PHP: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
}
export const money = (amount, currency = 'PHP') => (currencies[currency] || currencies.PHP).format(amount)

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function stars(rating) {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

// Products have no photos yet, so each one gets a festive icon on a colored background (CSS only)
const LOOKS = {
  'rfid-leather-wallet': { icon: '👛', tint: 'gold' },
  'smart-fitness-ring': { icon: '💍', tint: 'pine' },
  'desk-organizer-wireless-charger': { icon: '🗂️', tint: 'red' },
  'rugged-travel-tumbler': { icon: '🥤', tint: 'cream' },
  'beard-grooming-kit': { icon: '🧴', tint: 'gold' },
  'portable-power-bank': { icon: '🔋', tint: 'pine' },
  'noise-canceling-earbuds': { icon: '🎧', tint: 'red' },
  'cocktail-whiskey-smoker-kit': { icon: '🍸', tint: 'cream' },
  'running-shoes-sneakers': { icon: '👟', tint: 'gold' },
  'erasable-smart-notebook': { icon: '📓', tint: 'pine' },
  'aromatherapy-diffuser-set': { icon: '🌿', tint: 'red' },
  'mulberry-silk-sleep-set': { icon: '😴', tint: 'cream' },
  'layered-necklace-hoops': { icon: '📿', tint: 'gold' },
  'photo-memory-book': { icon: '📔', tint: 'pine' },
  'quilted-sling-belt-bag': { icon: '👜', tint: 'red' },
  'hydrogel-mask-set': { icon: '🧖', tint: 'cream' },
  'fragrance-discovery-set': { icon: '🧴', tint: 'gold' },
  'fleece-lounge-set': { icon: '🧥', tint: 'pine' },
  'ceramic-candle-warmer': { icon: '🕯️', tint: 'red' },
  'hair-blowout-kit': { icon: '💨', tint: 'cream' },
  'bluetooth-item-finder': { icon: '🔑', tint: 'gold' },
  'waterproof-bluetooth-speaker': { icon: '🔊', tint: 'pine' },
  'sunset-projection-lamp': { icon: '🌅', tint: 'red' },
  'weighted-blanket': { icon: '🛌', tint: 'cream' },
  'stainless-water-bottle': { icon: '🍶', tint: 'gold' },
  'portable-photo-label-printer': { icon: '🖨️', tint: 'pine' },
  'microfiber-bathrobe': { icon: '🥋', tint: 'red' },
  'desktop-herb-garden': { icon: '🪴', tint: 'cream' },
  'party-board-card-games': { icon: '🎲', tint: 'gold' },
  'hanging-toiletry-bag': { icon: '🧳', tint: 'pine' },
  'couples-matching-bracelets': { icon: '💞', tint: 'red' },
  'couples-ceramic-mugs': { icon: '☕', tint: 'cream' },
  'couples-memory-scrapbook': { icon: '📸', tint: 'gold' },
  'couples-date-night-cards': { icon: '💌', tint: 'pine' },
  'couples-matching-hoodies': { icon: '🧥', tint: 'red' },
  'couples-picnic-gift-set': { icon: '🧺', tint: 'cream' },
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
