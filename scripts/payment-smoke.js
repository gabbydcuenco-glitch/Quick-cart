const assert = require('node:assert/strict');

// Exercise the real gateway route without creating orders or storing card data.
// These are simulated payments only; no external payment provider is contacted.
async function verifyPayments(base = 'http://proxy:8080') {
  const expiry = '12/' + String((new Date().getUTCFullYear() + 2) % 100).padStart(2, '0');
  const card = { name: 'Demo Test', number: '4242424242424242', expiry, cvv: '123' };
  const cases = [
    ...['card', 'paypal', 'gpay'].map(method => ({
      label: method + ' approval', body: { method, amountCents: 1500, ...(method === 'card' ? { card } : {}) },
      status: 200, approved: true,
    })),
    { label: 'declined card', body: { method: 'card', amountCents: 1500, card: { ...card, number: '4000000000000002' } }, status: 200, approved: false },
    { label: 'expired card', body: { method: 'card', amountCents: 1500, card: { ...card, expiry: '01/20' } }, status: 200, approved: false },
    ...['paypal', 'gpay'].map(method => ({
      label: method + ' invalid amount', body: { method, amountCents: -1 }, status: 400, approved: false,
    })),
  ];
  for (const check of cases) {
    const response = await fetch(base + '/api/payment/charge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(check.body), signal: AbortSignal.timeout(10000),
    });
    assert.equal(response.status, check.status, check.label);
    assert.match(response.headers.get('content-type') || '', /application\/json/, 'payment route must return API JSON');
    const result = await response.json();
    assert.equal(result.approved, check.approved, check.label);
    if (check.approved) assert.match(result.reference, /^PAY-[A-F0-9]{8}$/);
    else assert.equal(typeof result.reason, 'string');
    assert.equal('card' in result, false, 'card details must not be returned');
  }
  console.log('Payment gateway passed: card, PayPal, Google Pay, declines and validation through the proxy');
}

verifyPayments(process.argv[2]).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
