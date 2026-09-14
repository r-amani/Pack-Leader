import { createApp } from '../../app';
import request from 'supertest';

describe('Health Check', () => {
  const app = createApp();

  it('GET /api/health should return 200 with status ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.services).toBeDefined();
    expect(response.body.data.uptime).toBeDefined();
  });

  it('GET /api/nonexistent should return 404', async () => {
    const response = await request(app).get('/api/nonexistent');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
