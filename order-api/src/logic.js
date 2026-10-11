// Checkout rules (pure functions, unit-tested with Jest).
// All money is handled in CENTS (whole numbers) so there are no rounding mistakes.

const HOLIDAY_DISCOUNT_THRESHOLD_CENTS = 300000; // spend PHP 3,000 ...
const HOLIDAY_DISCOUNT_CENTS = 30000;             // ... and get PHP 300 off
const EXPRESS_SHIPPING_CENTS = 14900;            // Express PHP 149 (Standard is free)
const DELIVERY_METHODS = ['standard', 'express'];

// lines: [{ unitPriceCents, quantity }]
function calculateTotals(lines, delivery) {
  if (!DELIVERY_METHODS.includes(delivery)) throw new Error('Unknown delivery method');
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const discountCents = subtotalCents >= HOLIDAY_DISCOUNT_THRESHOLD_CENTS ? HOLIDAY_DISCOUNT_CENTS : 0;
  const shippingCents = delivery === 'express' ? EXPRESS_SHIPPING_CENTS : 0;
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: subtotalCents - discountCents + shippingCents,
  };
}

// The same product twice in the cart becomes one line with the summed quantity
function mergeItems(items) {
  const byId = new Map();
  for (const item of items) {
    byId.set(item.productId, (byId.get(item.productId) || 0) + item.quantity);
  }
  return [...byId].map(([productId, quantity]) => ({ productId, quantity }));
}

// QC-2026-10003 (year of the order + order id)
function formatOrderNumber(orderId, date = new Date()) {
  return `QC-${date.getFullYear()}-${String(10000 + orderId).padStart(5, '0')}`;
}

const dollars = (cents) => cents / 100;
const toCents = (value) => Math.round(Number(value) * 100);

module.exports = {
  calculateTotals, mergeItems, formatOrderNumber, dollars, toCents,
  HOLIDAY_DISCOUNT_THRESHOLD_CENTS, HOLIDAY_DISCOUNT_CENTS, EXPRESS_SHIPPING_CENTS, DELIVERY_METHODS,
};
