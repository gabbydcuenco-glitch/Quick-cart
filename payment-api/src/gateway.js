// Mock payment gateway (pure functions, unit-tested with Jest).
// It never stores or logs card data. Test cards:
//   4242 4242 4242 4242  -> approved
//   4000 0000 0000 0002  -> declined ("Your card was declined")
const crypto = require('crypto');

const METHODS = ['card', 'paypal', 'gpay'];

// Luhn checksum: catches typing mistakes in card numbers
function luhnValid(number) {
  const digits = String(number).replace(/\s|-/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

// expiry "MM/YY": valid when the month is 1-12 and the card is not expired yet
function expiryValid(expiry, now = new Date()) {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(expiry || '').trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  // a card is valid until the last day of its expiry month
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

function newReference() {
  return `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// returns { approved: true, reference } or { approved: false, reason }
function charge({ method, amountCents, card } = {}, now = new Date()) {
  if (!METHODS.includes(method)) return { approved: false, reason: 'Unknown payment method' };
  if (!Number.isInteger(amountCents) || amountCents <= 0) return { approved: false, reason: 'Invalid amount' };

  if (method !== 'card') return { approved: true, reference: newReference() };

  if (!card || !String(card.name || '').trim()) return { approved: false, reason: 'Name on card is required' };
  if (!luhnValid(card.number)) return { approved: false, reason: 'Card number is not valid' };
  if (!expiryValid(card.expiry, now)) return { approved: false, reason: 'Card has expired or the date is not valid' };
  if (!/^\d{3,4}$/.test(String(card.cvv || ''))) return { approved: false, reason: 'CVV is not valid' };

  // demo rule: this test card is always declined
  if (String(card.number).replace(/\s|-/g, '').endsWith('0002')) {
    return { approved: false, reason: 'Your card was declined. Please try another card.' };
  }
  return { approved: true, reference: newReference() };
}

module.exports = { charge, luhnValid, expiryValid, METHODS };
