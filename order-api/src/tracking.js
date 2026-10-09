const STATUSES = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
function estimate(delivery, now = new Date()) {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() + (delivery === 'express' ? 1 : 3));
  return { start: start.toISOString(), end: new Date(start.getTime() + 4 * 3600000).toISOString() };
}
function transition(status, action) {
  if (action === 'receive' && status === 'Delivered') return status;
  const index = STATUSES.indexOf(status);
  if (action === 'advance' && index >= 0 && index < 2) return STATUSES[index + 1];
  if (action === 'receive' && status === 'Out for Delivery') return 'Delivered';
  const error = new Error('This delivery step is not available yet. Refresh the order and try again.');
  error.status = 409;
  throw error;
}
module.exports = { STATUSES, estimate, transition };
