const request = require('supertest');
const app = require('../src/app');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));

const dbUrl = process.env.DATABASE_URL || 
  `mysql://${process.env.DB_USER || 'root'}:${process.env.DB_PASS || ''}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3307'}/${process.env.DB_NAME || 'diary_db'}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

let userToken;
let otherUserToken;
let user1Id;
let groupId;
let otherGroupId;
let capsuleId;
let mediaId;

const generateId = () => Math.random().toString(36).substring(2, 15);

beforeAll(async () => {
  // Clear any existing test data to ensure test isolation
  await prisma.groupActivity.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.media.deleteMany({});
  await prisma.capsule.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Register test users
  const registerRes1 = await request(app).post('/auth/register').send({
    username: 'testuser1',
    email: 'testuser1@example.com',
    password: 'password123'
  });
  
  const registerRes2 = await request(app).post('/auth/register').send({
    username: 'testuser2',
    email: 'testuser2@example.com',
    password: 'password123'
  });

  // 2. Login
  const loginRes1 = await request(app).post('/auth/login').send({
    email: 'testuser1@example.com',
    password: 'password123'
  });
  userToken = loginRes1.body.token;
  user1Id = loginRes1.body.user.id;

  const loginRes2 = await request(app).post('/auth/login').send({
    email: 'testuser2@example.com',
    password: 'password123'
  });
  otherUserToken = loginRes2.body.token;

  // 3. Create a Group using API
  const groupRes = await request(app)
    .post('/groups')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Main Test Group',
      description: 'Group for history and media testing'
    });
  groupId = groupRes.body.data.id;

  // 4. Create another Group (for otherUser) to test isolation
  const otherGroupRes = await request(app)
    .post('/groups')
    .set('Authorization', `Bearer ${otherUserToken}`)
    .send({
      name: 'Isolated Group',
      description: 'Private other group'
    });
  otherGroupId = otherGroupRes.body.data.id;

  // 5. Let otherUser join the main group as well
  await prisma.groupMember.create({
    data: {
      userId: loginRes2.body.user.id,
      groupId: groupId,
      role: 'member'
    }
  });

  // 6. Seed Capsules & Media using Prisma
  const unlockedCapsule = await prisma.capsule.create({
    data: {
      id: generateId(),
      userId: loginRes1.body.user.id,
      title: 'Unlocked Summer Trip',
      content: 'We went to Hawaii beach 📍 Hawaii',
      open_at: new Date(Date.now() - 10000), // opened in the past
      status: 'unlocked',
      isOpened: true
    }
  });
  capsuleId = unlockedCapsule.id;

  const lockedCapsule = await prisma.capsule.create({
    data: {
      id: generateId(),
      userId: loginRes1.body.user.id,
      title: 'Locked Winter Trip',
      content: 'Private winter details 📍 Aspen',
      open_at: new Date(Date.now() + 86400000), // opens tomorrow
      status: 'locked',
      isOpened: false
    }
  });

  // Add media to unlocked capsule
  const media1 = await prisma.media.create({
    data: {
      id: generateId(),
      userId: loginRes1.body.user.id,
      diaryId: unlockedCapsule.id,
      url: 'http://cloudinary.com/hawaii.png',
      type: 'image',
      filename: 'hawaii_beach.png'
    }
  });
  mediaId = media1.id;

  // Add media to locked capsule
  await prisma.media.create({
    data: {
      id: generateId(),
      userId: loginRes1.body.user.id,
      diaryId: lockedCapsule.id,
      url: 'http://cloudinary.com/aspen.png',
      type: 'image',
      filename: 'aspen_snow.png'
    }
  });

  // 7. Seed Group Activities using Prisma
  await prisma.groupActivity.create({
    data: {
      id: generateId(),
      groupId: groupId,
      userId: loginRes1.body.user.id,
      activityType: 'member_joined',
      details: 'testuser1 đã tham gia nhóm.',
      createdAt: new Date()
    }
  });

  await prisma.groupActivity.create({
    data: {
      id: generateId(),
      groupId: groupId,
      userId: loginRes1.body.user.id,
      activityType: 'capsule_created',
      details: 'testuser1 đã tạo Time Capsule "Unlocked Summer Trip".',
      createdAt: new Date(Date.now() + 1000)
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Group History API - GET /api/groups/:groupId/history', () => {
  test('Should return 403 Forbidden if user is not in the group', async () => {
    // Attempting to access isolated other group with user1 token
    const res = await request(app)
      .get(`/api/groups/${otherGroupId}/history`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Should return history list for members of the group', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/history`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(2);
    
    // Check elements have necessary fields
    const firstEvent = res.body.data[0];
    expect(firstEvent).toHaveProperty('id');
    expect(firstEvent).toHaveProperty('activityType');
    expect(firstEvent).toHaveProperty('createdAt');
    expect(firstEvent).toHaveProperty('userId');
  });

  test('Should support filtering by activityType', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/history?activityType=member_joined`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].activityType).toBe('member_joined');
  });

  test('Should support pagination', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/history?page=1&limit=1`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.limit).toBe(1);
    expect(res.body.data.length).toBe(1);
  });
});

describe('Media Search API - GET /api/groups/:groupId/media/search', () => {
  test('Should return 403 Forbidden if user is not in the group', async () => {
    const res = await request(app)
      .get(`/api/groups/${otherGroupId}/media/search`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Should search and return only UNLOCKED media within the group', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/media/search`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    
    // Should return the hawaii beach media but NOT the aspen snow media (since Aspen is locked)
    const filenames = res.body.data.map(m => m.filename);
    expect(filenames).toContain('hawaii_beach.png');
    expect(filenames).not.toContain('aspen_snow.png');
  });

  test('Should filter by keyword', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/media/search?keyword=Hawaii`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].filename).toBe('hawaii_beach.png');
  });

  test('Should filter by location', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/media/search?location=Hawaii`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].filename).toBe('hawaii_beach.png');
  });

  test('Should filter by uploader userId', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/media/search?userId=${user1Id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});
