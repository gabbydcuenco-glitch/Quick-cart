jest.mock('../src/db', () => ({ connect: jest.fn(), query: jest.fn() }));
const pool = require('../src/db');
const { updateDelivery } = require('../src/repo');
let client;
beforeEach(() => {
  jest.resetAllMocks();
  client = { query: jest.fn().mockResolvedValue({rows:[]}), release: jest.fn() };
  pool.connect.mockResolvedValue(client);
  pool.query.mockResolvedValue({rows:[]});
});
function stored(status) {
  client.query.mockImplementation(async sql => ({rows: sql.startsWith('SELECT order_id') ? [{order_id:7,status}] : []}));
}
test('locks order and atomically persists status, event, and audit log', async () => {
  stored('Processing');
  await updateDelivery('QC-7','advance','Processing');
  const sql = client.query.mock.calls.map(c=>c[0]);
  expect(sql[0]).toBe('BEGIN');
  expect(sql[1]).toContain('FOR UPDATE');
  expect(sql.some(s=>s.startsWith('UPDATE orders'))).toBe(true);
  expect(sql.some(s=>s.startsWith('INSERT INTO delivery_events'))).toBe(true);
  expect(sql.some(s=>s.startsWith('INSERT INTO activity_logs'))).toBe(true);
  expect(sql.at(-1)).toBe('COMMIT');
  expect(client.release).toHaveBeenCalled();
});
test('stale concurrent advance cannot skip a delivery stage', async () => {
  stored('Shipped');
  await expect(updateDelivery('QC-7','advance','Processing')).rejects.toMatchObject({status:409});
  expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(client.query.mock.calls.some(c=>c[0].startsWith('UPDATE'))).toBe(false);
});
test('duplicate receipt confirmation preserves timestamp and creates no duplicate event', async () => {
  stored('Delivered');
  await updateDelivery('QC-7','receive','Out for Delivery');
  expect(client.query.mock.calls.some(c=>c[0].startsWith('UPDATE') || c[0].startsWith('INSERT'))).toBe(false);
});
test('event write failure rolls back the status change', async () => {
  client.query.mockImplementation(async sql => {
    if(sql.startsWith('INSERT INTO delivery_events')) throw new Error('DB unavailable');
    return {rows: sql.startsWith('SELECT order_id') ? [{order_id:7,status:'Shipped'}] : []};
  });
  await expect(updateDelivery('QC-7','advance','Shipped')).rejects.toThrow('DB unavailable');
  expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(client.release).toHaveBeenCalled();
});
