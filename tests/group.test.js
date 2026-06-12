const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models/index');

let token;
let groupId;
let inviteCode;

beforeAll(async () => {
  await sequelize.authenticate();

  await request(app).post('/auth/register').send({
    username: 'groupuser',
    email: 'group@gmail.com',
    password: '123456'
  }).catch(() => {});

  const res = await request(app).post('/auth/login').send({
    email: 'group@gmail.com',
    password: '123456'
  });
  token = res.body.token;
});
afterAll(async () => {
});
describe('Group API', () => {
  test('POST /groups — create group', async () => {
    const res = await request(app)
      .post('/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Group',
        description: 'Group for testing'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('Test Group');
    expect(res.body.data.inviteCode).toBeDefined();
    groupId = res.body.data.id;
    inviteCode = res.body.data.inviteCode;
  });

  test('GET /groups — get my groups', async () => {
    const res = await request(app)
      .get('/groups')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /groups/:id — get group detail', async () => {
    const res = await request(app)
      .get(`/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(groupId);
    expect(res.body.data.members).toBeInstanceOf(Array);
  });

  test('POST /groups/join — join with invite code', async () => {
    // Tạo user thứ 2 để join
    await request(app).post('/auth/register').send({
      username: 'groupuser2',
      email: 'group2@gmail.com',
      password: '123456'
    });
    const loginRes = await request(app).post('/auth/login').send({
      email: 'group2@gmail.com',
      password: '123456'
    });
    const token2 = loginRes.body.token;

    const res = await request(app)
      .post('/groups/join')
      .set('Authorization', `Bearer ${token2}`)
      .send({ inviteCode });
    expect(res.statusCode).toBe(200);
  });

  test('POST /groups/join — invalid invite code', async () => {
    const res = await request(app)
      .post('/groups/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ inviteCode: 'INVALID' });
    expect(res.statusCode).toBe(404);
  });

  test('POST /groups/:id/regenerate-code — new invite code', async () => {
    const res = await request(app)
      .post(`/groups/${groupId}/regenerate-code`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.inviteCode).toBeDefined();
    expect(res.body.inviteCode).not.toBe(inviteCode);
  });

  test('GET /groups — without token', async () => {
    const res = await request(app)
      .get('/groups');
    expect(res.statusCode).toBe(401);
  });
});