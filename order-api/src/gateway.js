// Calls payment-api over the Docker network (the browser can never reach it directly)
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://payment-api:3003';

// returns { approved, reference, reason }; throws if the payment service cannot be reached
async function charge({ method, amountCents, card }) {
  let res;
  try {
    res = await fetch(`${PAYMENT_URL}/api/payment/charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, amountCents, card }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error('Payment service unavailable');
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new Error('Payment service unavailable');
  return { approved: data.approved === true, reference: data.reference, reason: data.reason };
}

module.exports = { charge };
