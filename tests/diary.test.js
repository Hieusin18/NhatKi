const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, DiaryEntry } = require('../src/models/index');

let token;
let diaryId;
beforeAll(async () => {
  await sequelize.authenticate();

  // Register + login để lấy token
  await request(app).post('/auth/register').send({
    username: 'diaryuser',
    email: 'diary@gmail.com',
    password: '123456'
  }).catch(() => {}); // bỏ qua nếu user đã tồn tại

  const res = await request(app).post('/auth/login').send({
    email: 'diary@gmail.com',
    password: '123456'
  });
  token = res.body.token;
});

afterAll(async () => {
});
describe('Diary Timeline API', () => {
  test('POST /diary — create entry', async () => {
    const res = await request(app)
      .post('/diary')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test diary',
        content: 'Hello world',
        mood: 'happy',
        entryDate: '2024-06-01',
        visibility: 'private'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('Test diary');
    diaryId = res.body.data.id;
  });

  test('GET /diary/timeline — get timeline', async () => {
    const res = await request(app)
      .get('/diary/timeline')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  test('GET /diary/timeline — pagination', async () => {
    const res = await request(app)
      .get('/diary/timeline?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(5);
  });

  test('GET /diary/timeline — without token', async () => {
    const res = await request(app)
      .get('/diary/timeline');
    expect(res.statusCode).toBe(401);
  });

  test('PATCH /diary/:id/visibility — update visibility', async () => {
    const res = await request(app)
      .patch(`/diary/${diaryId}/visibility`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'public' });
    expect(res.statusCode).toBe(200);
    expect(res.body.visibility ?? res.body.data?.visibility).toBe('public');
  });
});

describe('Tags API', () => {
  test('POST /diary/:id/tags — attach tag', async () => {
    const res = await request(app)
      .post(`/diary/${diaryId}/tags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tag_name: 'gia dinh' });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.tag?.name ?? res.body.data?.name).toBe('gia dinh');
  });

  test('GET /diary/search?tag= — search by tag', async () => {
    const res = await request(app)
      .get('/diary/search?tag=gia dinh')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('DELETE /diary/:id/tags/:tagId — detach tag', async () => {
    // Lấy tagId từ timeline
    const timeline = await request(app)
      .get('/diary/timeline')
      .set('Authorization', `Bearer ${token}`);
    const tagId = timeline.body.data[0]?.tags?.[0]?.id;

    if (tagId) {
      const res = await request(app)
        .delete(`/diary/${diaryId}/tags/${tagId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
    }
  });
});