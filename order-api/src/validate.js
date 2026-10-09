// Input validation (pure functions, unit-tested with Jest).
// Every function returns { valid, errors }.
const { DELIVERY_METHODS } = require('./logic');

const PAYMENT_METHODS = ['card', 'paypal', 'gpay'];
const MAX_QUANTITY = 10;

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isText = (v, max = 150) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

function checkItems(items, errors) {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push('Your cart is empty');
    return;
  }
  for (const item of items) {
    const okId = Number.isInteger(item && item.productId) && item.productId > 0;
    const okQty = Number.isInteger(item && item.quantity) && item.quantity >= 1 && item.quantity <= MAX_QUANTITY;
    if (!okId || !okQty) {
      errors.push(`Each item needs a product id and a quantity from 1 to ${MAX_QUANTITY}`);
      return;
    }
  }
}

// POST /api/orders/quote
function validateQuote(body = {}) {
  const errors = [];
  checkItems(body.items, errors);
  if (!DELIVERY_METHODS.includes(body.delivery)) errors.push('Delivery must be standard or express');
  return { valid: errors.length === 0, errors };
}

// POST /api/orders
function validateCheckout(body = {}) {
  const errors = [];
  const c = body.customer || {};

  checkItems(body.items, errors);
  if (!DELIVERY_METHODS.includes(body.delivery)) errors.push('Delivery must be standard or express');

  if (!isEmail(c.email)) errors.push('A valid email is required');
  if (!isText(c.fullName, 100)) errors.push('Full name is required');
  if (!isText(c.street, 150)) errors.push('Street address is required');
  if (!isText(c.city, 80)) errors.push('City is required');
  if (!isText(c.state, 80)) errors.push('State / province is required');
  if (!/^[0-9A-Za-z -]{3,12}$/.test(String(c.zip || '').trim())) errors.push('A valid zip code is required');
  if (!/^[0-9+() -]{7,30}$/.test(String(c.phone || '').trim())) errors.push('A valid phone number is required');

  const payment = body.payment || {};
  if (!PAYMENT_METHODS.includes(payment.method)) {
    errors.push('Choose a payment method');
  } else if (payment.method === 'card' && !(payment.card && typeof payment.card === 'object')) {
    errors.push('Card details are required');
  }
  return { valid: errors.length === 0, errors };
}

// POST /api/support/tickets (Contact page)
function validateTicket(body = {}) {
  const errors = [];
  if (!isText(body.name, 100)) errors.push('Name is required');
  if (!isEmail(body.email)) errors.push('A valid email is required');
  if (!isText(body.subject, 120)) errors.push('Subject is required');
  if (!isText(body.message, 2000)) errors.push('Message is required (up to 2000 characters)');
  return { valid: errors.length === 0, errors };
}

module.exports = { validateQuote, validateCheckout, validateTicket, isEmail, MAX_QUANTITY };
