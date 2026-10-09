const request = require('supertest');
jest.mock('../src/repo', () => ({ updateDelivery: jest.fn() }));
const repo = require('../src/repo');
const app = require('../src/server');
const original = process.env.DELIVERY_DEMO;
beforeEach(() => { jest.resetAllMocks(); process.env.DELIVERY_DEMO = 'true'; });
afterAll(() => { if (original === undefined) delete process.env.DELIVERY_DEMO; else process.env.DELIVERY_DEMO = original; });
test('demo must be explicitly enabled', async () => {
  delete process.env.DELIVERY_DEMO;
  await request(app).post('/api/orders/QC-1/delivery').send({action:'advance',expectedStatus:'Processing'}).expect(403);
  expect(repo.updateDelivery).not.toHaveBeenCalled();
});
test('invalid actions never mutate orders', async () => {
  await request(app).post('/api/orders/QC-1/delivery').send({action:'delete'}).expect(400);
  expect(repo.updateDelivery).not.toHaveBeenCalled();
});
test('valid action includes the status observed by the browser', async () => {
  repo.updateDelivery.mockResolvedValue({status:'Shipped'});
  await request(app).post('/api/orders/QC-1/delivery').send({action:'advance',expectedStatus:'Processing'}).expect(200,{status:'Shipped'});
  expect(repo.updateDelivery).toHaveBeenCalledWith('QC-1','advance','Processing');
});
test.each([404,409])('returns repository error %s', async status => {
  repo.updateDelivery.mockRejectedValue(Object.assign(new Error('Refresh order'),{status}));
  await request(app).post('/api/orders/QC-1/delivery').send({action:'receive',expectedStatus:'Out for Delivery'}).expect(status);
});
