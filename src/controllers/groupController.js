const { Op }                        = require('sequelize');
const { Group, GroupMember, User }  = require('../models/index');

// Prisma is kept ONLY for groupActivity + media search (no Sequelize model yet).
// Migration to Sequelize is tracked in docs/adr/001-dual-orm.md — planned for v1.1.0.
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ||
    `mysql://${process.env.DB_USER||'root'}:${process.env.DB_PASS||''}@${process.env.DB_HOST||'127.0.0.1'}:${process.env.DB_PORT||'3306'}/${process.env.DB_NAME||'diary_db'}` } }
});

/** Generate a random 6-character uppercase invite code. @returns {string} */
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

/**
 * POST /groups
 * Create a new group with the authenticated user as owner.
 * @param {import('express').Request}  req - body: { name, description? }
 * @param {import('express').Response} res - 201 { data: Group } | 400 | 500
 */
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required.' });

    const group = await Group.create({ name, description, ownerId: req.user.id, inviteCode: genCode() });
    await GroupMember.create({ userId: req.user.id, groupId: group.id, role: 'owner' });

    res.status(201).json({ message: 'Group created!', data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /groups/join
 * Join a group using an invite code.
 * @param {import('express').Request}  req - body: { inviteCode }
 * @param {import('express').Response} res - 200 { data: Group } | 400 | 404 | 409 | 500
 */
exports.join = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Missing inviteCode.' });

    const group = await Group.findOne({ where: { inviteCode } });
    if (!group) return res.status(404).json({ message: 'Invalid invite code.' });

    const existed = await GroupMember.findOne({ where: { userId: req.user.id, groupId: group.id } });
    if (existed) return res.status(409).json({ message: 'Already a member.' });

    await GroupMember.create({ userId: req.user.id, groupId: group.id, role: 'member' });
    res.json({ message: `Joined group "${group.name}"!`, data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /groups
 * Return all groups the authenticated user belongs to.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res - 200 { data: Group[] } | 500
 */
exports.getMyGroups = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Group,
        as: 'groups',
        include: [{ model: User, as: 'members', attributes: ['id', 'username', 'avatar'] }],
      }],
    });
    res.json({ data: user.groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /groups/:id
 * Return a single group with its member list.
 * @param {import('express').Request}  req - params: { id }
 * @param {import('express').Response} res - 200 { data: Group } | 404 | 500
 */
exports.getOne = async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [{ model: User, as: 'members', attributes: ['id', 'username', 'avatar'] }],
    });
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    res.json({ data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /groups/:id/regenerate-code
 * Generate a new invite code for a group (owner only).
 * @param {import('express').Request}  req - params: { id }
 * @param {import('express').Response} res - 200 { inviteCode } | 404 | 500
 */
exports.regenerateCode = async (req, res) => {
  try {
    const group = await Group.findOne({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!group) return res.status(404).json({ message: 'Group not found or not owner.' });
    await group.update({ inviteCode: genCode() });
    res.json({ message: 'New invite code generated!', inviteCode: group.inviteCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Below: Prisma retained — groupActivity & media models not yet in Sequelize ───
// Migration tracked: docs/adr/001-dual-orm.md | Target: v1.1.0

/**
 * GET /api/groups/:groupId/history
 * Return paginated activity log for a group.
 * @param {import('express').Request}  req - params: { groupId }, query: { page?, limit?, activityType? }
 * @param {import('express').Response} res - 200 { data, meta } | 403 | 500
 */
exports.getGroupHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const isMember = await prisma.groupMember.findFirst({ where: { userId, groupId } });
    if (!isMember) return res.status(403).json({ message: 'Forbidden. You are not a member of this group.' });

    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
    const where  = { groupId };
    if (req.query.activityType) where.activityType = req.query.activityType;

    const total      = await prisma.groupActivity.count({ where });
    const activities = await prisma.groupActivity.findMany({ where, orderBy: { createdAt: 'desc' }, skip: offset, take: limit });

    const uploaderIds = [...new Set(activities.map(a => a.userId))];
    const users       = await prisma.user.findMany({ where: { id: { in: uploaderIds } }, select: { id: true, username: true, avatar: true } });
    const usersMap    = Object.fromEntries(users.map(u => [u.id, u]));

    return res.json({
      data: activities.map(a => ({ ...a, user: usersMap[a.userId] || null })),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit), has_next: page < Math.ceil(total / limit), has_prev: page > 1 },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/groups/:groupId/media/search
 * Search media files within a group with optional filters.
 * @param {import('express').Request}  req - params: { groupId }, query: { keyword?, userId?, fromDate?, toDate?, location?, page?, limit? }
 * @param {import('express').Response} res - 200 { data, meta } | 403 | 500
 */
exports.searchGroupMedia = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const isMember = await prisma.groupMember.findFirst({ where: { userId, groupId } });
    if (!isMember) return res.status(403).json({ message: 'Forbidden. You are not a member of this group.' });

    const groupMembers = await prisma.groupMember.findMany({ where: { groupId } });
    const memberIds    = groupMembers.map(m => m.userId);
    const { keyword, userId: filterUserId, fromDate, toDate, location } = req.query;

    const capsuleWhere = { userId: { in: memberIds }, status: 'unlocked' };
    if (location) capsuleWhere.OR = [{ title: { contains: location } }, { content: { contains: location } }];

    const capsules    = await prisma.capsule.findMany({ where: capsuleWhere, include: { creator: { select: { id: true, username: true, avatar: true } } } });
    const capsuleIds  = capsules.map(c => c.id);
    const capsulesMap = Object.fromEntries(capsules.map(c => [c.id, c]));

    const mediaWhere  = { diaryId: { in: capsuleIds } };
    mediaWhere.userId = filterUserId || { in: memberIds };
    if (fromDate || toDate) {
      mediaWhere.createdAt = {};
      if (fromDate) mediaWhere.createdAt.gte = new Date(fromDate);
      if (toDate)   mediaWhere.createdAt.lte = new Date(toDate);
    }

    let mediaFiles = await prisma.media.findMany({ where: mediaWhere, orderBy: { createdAt: 'desc' } });
    const uploaderIds  = [...new Set(mediaFiles.map(m => m.userId))];
    const uploaders    = await prisma.user.findMany({ where: { id: { in: uploaderIds } }, select: { id: true, username: true, avatar: true } });
    const uploadersMap = Object.fromEntries(uploaders.map(u => [u.id, u]));

    let result = mediaFiles.map(m => {
      const c = capsulesMap[m.diaryId] || null;
      return { ...m, user: uploadersMap[m.userId] || null, capsule: c ? { id: c.id, title: c.title, content: c.content, open_at: c.open_at, creator: c.creator } : null };
    });

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(m =>
        (m.filename?.toLowerCase().includes(kw)) ||
        (m.capsule?.title?.toLowerCase().includes(kw)) ||
        (m.capsule?.content?.toLowerCase().includes(kw))
      );
    }

    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 10);
    const total  = result.length;
    return res.json({
      data: result.slice((page - 1) * limit, page * limit),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit), has_next: page < Math.ceil(total / limit), has_prev: page > 1 },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
