const { discountPercent, filterProducts, suggest, listCategories } = require('../src/catalog');

const products = [
  { id: 1, slug: 'pjs', name: 'Matching Couple PJs', category: 'Couples & Unisex', price: 78, discountPercent: 30 },
  { id: 2, slug: 'camera', name: 'Instant Film Camera Set', category: 'Gifts', price: 29, discountPercent: 0 },
  { id: 3, slug: 'family', name: 'Family Matching Pajamas', category: 'Family', price: 95, discountPercent: 20 },
];

describe('discountPercent', () => {
  test('78 against a list price of 111 is about 30 percent', () => {
    expect(discountPercent(78, 111)).toBe(30);
  });
  test('no list price means no discount', () => {
    expect(discountPercent(29, null)).toBe(0);
  });
  test('a list price that is not higher means no discount', () => {
    expect(discountPercent(50, 50)).toBe(0);
    expect(discountPercent(60, 50)).toBe(0);
  });
});

describe('filterProducts', () => {
  test('returns everything when there is no filter', () => {
    expect(filterProducts(products)).toHaveLength(3);
  });
  test('search matches the name in any letter case', () => {
    expect(filterProducts(products, { q: 'MATCHING' }).map((p) => p.id)).toEqual([1, 3]);
  });
  test('category filter is exact', () => {
    expect(filterProducts(products, { category: 'Gifts' }).map((p) => p.id)).toEqual([2]);
  });
  test('deals only keeps discounted products', () => {
    expect(filterProducts(products, { deals: true }).map((p) => p.id)).toEqual([1, 3]);
  });
});

describe('suggest', () => {
  test('needs at least two letters', () => {
    expect(suggest(products, 'm')).toEqual([]);
    expect(suggest(products, '')).toEqual([]);
  });
  test('returns matching products with only the fields the drop-down needs', () => {
    expect(suggest(products, 'match')).toEqual([
      { id: 1, slug: 'pjs', name: 'Matching Couple PJs', price: 78, category: 'Couples & Unisex' },
      { id: 3, slug: 'family', name: 'Family Matching Pajamas', price: 95, category: 'Family' },
    ]);
  });
  test('respects the limit', () => {
    expect(suggest(products, 'a', 1)).toEqual([]);
    expect(suggest(products, 'in', 1)).toHaveLength(1);
  });
});

test('listCategories returns each category once, sorted', () => {
  expect(listCategories(products)).toEqual(['Couples & Unisex', 'Family', 'Gifts']);
});
