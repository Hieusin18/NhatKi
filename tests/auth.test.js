const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models/index');

beforeAll(async () => {
  await sequelize.authenticate();
});
afterAll(async () => {
  // không close để tránh conflict
});
describe('Auth API', () => {
 const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@gmail.com`,
  password: '123456'
};
  let token;

  test('POST /auth/register — success', async () => {
    const res = await request(app).post('/auth/register').send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  test('POST /auth/register — duplicate email', async () => {
    const res = await request(app).post('/auth/register').send(testUser);
    expect(res.statusCode).toBe(409);
  });

  test('POST /auth/login — success', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('POST /auth/login — wrong password', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: testUser.email, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /auth/me — with token', async () => {
    const loginRes = await request(app).post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    const res = await request(app).get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /auth/me — without token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.statusCode).toBe(401);
  });
});