const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('should return 200 OK with operational status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('message', 'StaffSync HRMS API is operational');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });

  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('success', false);
  });
});
