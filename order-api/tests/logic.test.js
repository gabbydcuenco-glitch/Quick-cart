const { calculateTotals, mergeItems, formatOrderNumber, dollars, toCents } = require('../src/logic');

describe('calculateTotals', () => {
  test('PHP 4000 subtotal gets PHP 300 discount', () => {
    const lines = [
      { unitPriceCents: 250000, quantity: 1 },
      { unitPriceCents: 100000, quantity: 1 },
      { unitPriceCents: 50000, quantity: 1 },
    ];
    expect(calculateTotals(lines, 'standard')).toEqual({
      subtotalCents: 400000, discountCents: 30000, shippingCents: 0, totalCents: 370000,
    });
  });
  test('no discount below PHP 3000', () => {
    const t = calculateTotals([{ unitPriceCents: 299999, quantity: 1 }], 'standard');
    expect(t.discountCents).toBe(0);
    expect(t.totalCents).toBe(299999);
  });
  test('exactly PHP 3000 gets the discount', () => {
    expect(calculateTotals([{ unitPriceCents: 300000, quantity: 1 }], 'standard').discountCents).toBe(30000);
  });
  test('express delivery adds PHP 149', () => {
    const t = calculateTotals([{ unitPriceCents: 100000, quantity: 1 }], 'express');
    expect(t.shippingCents).toBe(14900);
    expect(t.totalCents).toBe(114900);
  });
  test('quantity multiplies the price', () => {
    expect(calculateTotals([{ unitPriceCents: 50000, quantity: 3 }], 'standard').subtotalCents).toBe(150000);
  });
  test('unknown delivery method throws', () => {
    expect(() => calculateTotals([], 'drone')).toThrow('Unknown delivery method');
  });
});

describe('mergeItems', () => {
  test('adds up the quantity of the same product', () => {
    expect(mergeItems([{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }, { productId: 1, quantity: 3 }]))
      .toEqual([{ productId: 1, quantity: 5 }, { productId: 2, quantity: 1 }]);
  });
});

describe('helpers', () => {
  test('formatOrderNumber uses the year and the order id', () => {
    expect(formatOrderNumber(3, new Date('2026-12-14T00:00:00Z'))).toBe('QC-2026-10003');
  });
  test('toCents and dollars avoid rounding mistakes', () => {
    expect(toCents('29.99')).toBe(2999);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(dollars(11200)).toBe(112);
  });
});
