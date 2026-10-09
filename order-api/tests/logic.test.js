const { calculateTotals, mergeItems, formatOrderNumber, dollars, toCents } = require('../src/logic');

describe('calculateTotals', () => {
  test('$122 subtotal gets the $10 holiday discount: total $112 (same as the design mockup)', () => {
    const lines = [
      { unitPriceCents: 7800, quantity: 1 },
      { unitPriceCents: 2900, quantity: 1 },
      { unitPriceCents: 1500, quantity: 1 },
    ];
    expect(calculateTotals(lines, 'standard')).toEqual({
      subtotalCents: 12200, discountCents: 1000, shippingCents: 0, totalCents: 11200,
    });
  });
  test('no discount below $100', () => {
    const t = calculateTotals([{ unitPriceCents: 9999, quantity: 1 }], 'standard');
    expect(t.discountCents).toBe(0);
    expect(t.totalCents).toBe(9999);
  });
  test('exactly $100 already gets the discount', () => {
    expect(calculateTotals([{ unitPriceCents: 10000, quantity: 1 }], 'standard').discountCents).toBe(1000);
  });
  test('express delivery adds $14.99', () => {
    const t = calculateTotals([{ unitPriceCents: 2900, quantity: 1 }], 'express');
    expect(t.shippingCents).toBe(1499);
    expect(t.totalCents).toBe(4399);
  });
  test('quantity multiplies the price', () => {
    expect(calculateTotals([{ unitPriceCents: 1500, quantity: 3 }], 'standard').subtotalCents).toBe(4500);
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
