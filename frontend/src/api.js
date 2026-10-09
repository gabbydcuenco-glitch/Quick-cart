// All calls to the backend go through the Nginx proxy (same origin), so no URLs or CORS to configure.
async function request(url, options) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error((data && data.error) || 'Something went wrong. Please try again.')
    error.status = res.status
    throw error
  }
  return data
}

const post = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const getProducts = (params = {}) => request('/api/catalog/products?' + new URLSearchParams(params))
export const getProduct = (id) => request(`/api/catalog/products/${id}`)
export const getSuggestions = (q) => request('/api/catalog/suggest?q=' + encodeURIComponent(q))
export const getQuote = (items, delivery) => request('/api/orders/quote', post({ items, delivery }))
export const placeOrder = (order) => request('/api/orders', post(order))
export const getOrders = (email) => request('/api/orders?email=' + encodeURIComponent(email))
export const getOrder = (orderNumber) => request(`/api/orders/${encodeURIComponent(orderNumber)}`)
export const updateDelivery = (number, action, expectedStatus) => request(`/api/orders/${encodeURIComponent(number)}/delivery`, post({ action, expectedStatus }))
export const sendTicket = (ticket) => request('/api/support/tickets', post(ticket))
