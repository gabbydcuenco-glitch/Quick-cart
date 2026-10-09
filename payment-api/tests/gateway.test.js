const { charge, luhnValid, expiryValid } = require('../src/gateway');

const NOW = new Date('2026-10-06T00:00:00Z');
const goodCard = { number: '4242 4242 4242 4242', expiry: '12/30', cvv: '123', name: 'John Cuenco' };

describe('luhnValid', () => {
  test('accepts a valid test card number', () => {
    expect(luhnValid('4242 4242 4242 4242')).toBe(true);
  });
  test('rejects a number with one wrong digit', () => {
    expect(luhnValid('4242 4242 4242 4243')).toBe(false);
  });
  test('rejects letters and short numbers', () => {
    expect(luhnValid('abcd')).toBe(false);
    expect(luhnValid('4242')).toBe(false);
  });
});

describe('expiryValid', () => {
  test('accepts a future date', () => {
    expect(expiryValid('12/30', NOW)).toBe(true);
  });
  test('accepts the current month', () => {
    expect(expiryValid('10/26', NOW)).toBe(true);
  });
  test('rejects a past month', () => {
    expect(expiryValid('09/26', NOW)).toBe(false);
  });
  test('rejects a bad format or month 13', () => {
    expect(expiryValid('1230', NOW)).toBe(false);
    expect(expiryValid('13/30', NOW)).toBe(false);
  });
});

describe('charge', () => {
  test('approves a good card and returns a reference', () => {
    const result = charge({ method: 'card', amountCents: 11200, card: goodCard }, NOW);
    expect(result.approved).toBe(true);
    expect(result.reference).toMatch(/^PAY-[A-F0-9]{8}$/);
  });
  test('declines the test card ending in 0002', () => {
    const result = charge({ method: 'card', amountCents: 11200, card: { ...goodCard, number: '4000 0000 0000 0002' } }, NOW);
    expect(result.approved).toBe(false);
    expect(result.reason).toMatch(/declined/);
  });
  test('rejects an expired card', () => {
    const result = charge({ method: 'card', amountCents: 500, card: { ...goodCard, expiry: '01/20' } }, NOW);
    expect(result.approved).toBe(false);
  });
  test('rejects a bad CVV', () => {
    const result = charge({ method: 'card', amountCents: 500, card: { ...goodCard, cvv: '12' } }, NOW);
    expect(result.approved).toBe(false);
  });
  test('approves PayPal and Google Pay without card details', () => {
    expect(charge({ method: 'paypal', amountCents: 500 }, NOW).approved).toBe(true);
    expect(charge({ method: 'gpay', amountCents: 500 }, NOW).approved).toBe(true);
  });
  test('rejects an unknown method and an invalid amount', () => {
    expect(charge({ method: 'cash', amountCents: 500 }, NOW).approved).toBe(false);
    expect(charge({ method: 'paypal', amountCents: 0 }, NOW).approved).toBe(false);
    expect(charge({ method: 'paypal', amountCents: 12.5 }, NOW).approved).toBe(false);
  });
});
