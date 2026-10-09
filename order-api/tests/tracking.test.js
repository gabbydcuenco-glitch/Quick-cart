const { estimate, transition } = require('../src/tracking');
test('delivery windows cross month boundaries and last four hours', () => {
  expect(estimate('standard', new Date('2026-01-30T08:00:00Z'))).toEqual({ start: '2026-02-02T08:00:00.000Z', end: '2026-02-02T12:00:00.000Z' });
  expect(estimate('express', new Date('2026-01-30T08:00:00Z')).start).toBe('2026-01-31T08:00:00.000Z');
});
test('delivery follows the full sequence and requires receipt at the last stage', () => {
  expect(transition('Processing','advance')).toBe('Shipped');
  expect(transition('Shipped','advance')).toBe('Out for Delivery');
  expect(transition('Out for Delivery','receive')).toBe('Delivered');
  expect(transition('Delivered','receive')).toBe('Delivered');
});
test.each([['Processing','receive'],['Shipped','receive'],['Out for Delivery','advance'],['Delivered','advance'],['Unknown','advance']])('rejects illegal transition %s / %s', (status, action) => {
  expect(() => transition(status,action)).toThrow();
});
