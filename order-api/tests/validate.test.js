const { validateQuote, validateCheckout, validateTicket } = require('../src/validate');

const goodCheckout = {
  items: [{ productId: 1, quantity: 1 }],
  delivery: 'standard',
  customer: {
    email: 'john@example.com', fullName: 'John Cuenco', street: '123 Pine St', city: 'Angeles City',
    state: 'Pampanga', zip: '2009', phone: '+63 917 123 4567',
  },
  payment: { method: 'card', card: { number: '4242424242424242', expiry: '12/30', cvv: '123', name: 'John Cuenco' } },
};

describe('validateCheckout', () => {
  test('accepts a complete order', () => {
    expect(validateCheckout(goodCheckout).valid).toBe(true);
  });
  test('rejects an empty cart', () => {
    expect(validateCheckout({ ...goodCheckout, items: [] }).valid).toBe(false);
  });
  test('rejects a quantity above 10 or below 1', () => {
    expect(validateCheckout({ ...goodCheckout, items: [{ productId: 1, quantity: 11 }] }).valid).toBe(false);
    expect(validateCheckout({ ...goodCheckout, items: [{ productId: 1, quantity: 0 }] }).valid).toBe(false);
  });
  test('rejects a bad email', () => {
    const body = { ...goodCheckout, customer: { ...goodCheckout.customer, email: 'nope' } };
    expect(validateCheckout(body).valid).toBe(false);
  });
  test('rejects a missing street address', () => {
    const body = { ...goodCheckout, customer: { ...goodCheckout.customer, street: '  ' } };
    expect(validateCheckout(body).errors).toContain('Street address is required');
  });
  test('rejects an unknown delivery or payment method', () => {
    expect(validateCheckout({ ...goodCheckout, delivery: 'drone' }).valid).toBe(false);
    expect(validateCheckout({ ...goodCheckout, payment: { method: 'cash' } }).valid).toBe(false);
  });
  test('a card payment needs card details, PayPal does not', () => {
    expect(validateCheckout({ ...goodCheckout, payment: { method: 'card' } }).valid).toBe(false);
    expect(validateCheckout({ ...goodCheckout, payment: { method: 'paypal' } }).valid).toBe(true);
  });
  test('survives a completely empty body', () => {
    expect(validateCheckout(undefined).valid).toBe(false);
  });
});

describe('validateQuote', () => {
  test('needs items and a delivery method', () => {
    expect(validateQuote({ items: [{ productId: 1, quantity: 2 }], delivery: 'express' }).valid).toBe(true);
    expect(validateQuote({ items: [], delivery: 'express' }).valid).toBe(false);
    expect(validateQuote({ items: [{ productId: 1, quantity: 2 }] }).valid).toBe(false);
  });
});

describe('validateTicket', () => {
  const ticket = { name: 'John', email: 'john@example.com', subject: 'Late order', message: 'Where is my order?' };
  test('accepts a complete ticket', () => {
    expect(validateTicket(ticket).valid).toBe(true);
  });
  test('rejects a missing message or bad email', () => {
    expect(validateTicket({ ...ticket, message: '' }).valid).toBe(false);
    expect(validateTicket({ ...ticket, email: 'x' }).valid).toBe(false);
  });
});
