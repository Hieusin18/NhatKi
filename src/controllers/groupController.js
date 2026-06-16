const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../backend/node_modules/@prisma/client'));

const dbUrl = process.env.DATABASE_URL || 
  `mysql://${process.env.DB_USER || 'root'}:${process.env.DB_PASS || ''}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3306'}/${process.env.DB_NAME || 'diary_db'}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// POST /groups
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required.' });

    const group = await prisma.group.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        inviteCode: genCode(),
      }
    });

    await prisma.groupMember.create({
      data: {
        userId: req.user.id,
        groupId: group.id,
        role: 'owner'
      }
    });

    res.status(201).json({ message: 'Group created!', data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /groups/join
exports.join = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Missing inviteCode.' });

    const group = await prisma.group.findUnique({
      where: { inviteCode }
    });
    if (!group) return res.status(404).json({ message: 'Invalid invite code.' });

    const existed = await prisma.groupMember.findFirst({
      where: { userId: req.user.id, groupId: group.id }
    });
    if (existed) return res.status(409).json({ message: 'Already a member.' });

    await prisma.groupMember.create({
      data: {
        userId: req.user.id,
        groupId: group.id,
        role: 'member'
      }
    });

    res.json({ message: `Joined group "${group.name}"!`, data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /groups
exports.getMyGroups = async (req, res) => {
  try {
    const groupMembers = await prisma.groupMember.findMany({
      where: { userId: req.user.id },
      include: {
        group: {
          include: {
            groupMembers: {
              include: {
                user: {
                  select: { id: true, username: true, avatar: true }
                }
              }
            }
          }
        }
      }
    });

    const groups = groupMembers.map(gm => {
      const g = gm.group;
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        ownerId: g.ownerId,
        inviteCode: g.inviteCode,
        isActive: g.isActive,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        members: g.groupMembers.map(m => ({
          id: m.user.id,
          username: m.user.username,
          avatar: m.user.avatar,
          GroupMember: {
            role: m.role,
            joinedAt: m.joinedAt
          }
        }))
      };
    });

    res.json({ data: groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /groups/:id
exports.getOne = async (req, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        groupMembers: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true }
            }
          }
        }
      }
    });
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const data = {
      id: group.id,
      name: group.name,
      description: group.description,
      ownerId: group.ownerId,
      inviteCode: group.inviteCode,
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      members: group.groupMembers.map(m => ({
        id: m.user.id,
        username: m.user.username,
        avatar: m.user.avatar,
        GroupMember: {
          role: m.role,
          joinedAt: m.joinedAt
        }
      }))
    };

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /groups/:id/regenerate-code
exports.regenerateCode = async (req, res) => {
  try {
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, ownerId: req.user.id }
    });
    if (!group) return res.status(404).json({ message: 'Group not found or not owner.' });

    const updatedGroup = await prisma.group.update({
      where: { id: req.params.id },
      data: { inviteCode: genCode() }
    });

    res.json({ message: 'New invite code generated!', inviteCode: updatedGroup.inviteCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/groups/:groupId/history
exports.getGroupHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check membership
    const isMember = await prisma.groupMember.findFirst({
      where: { userId, groupId }
    });
    if (!isMember) {
      return res.status(403).json({ message: 'Forbidden. You are not a member of this group.' });
    }

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    // Build where condition
    const where = { groupId };
    if (req.query.activityType) {
      where.activityType = req.query.activityType;
    }

    const total = await prisma.groupActivity.count({ where });
    const activities = await prisma.groupActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Fetch user details manually for history mapping
    const uploaderIds = Array.from(new Set(activities.map(a => a.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, username: true, avatar: true }
    });
    const usersMap = {};
    users.forEach(u => {
      usersMap[u.id] = u;
    });

    const data = activities.map(a => ({
      id: a.id,
      groupId: a.groupId,
      userId: a.userId,
      activityType: a.activityType,
      details: a.details,
      createdAt: a.createdAt,
      user: usersMap[a.userId] || null
    }));

    return res.json({
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/groups/:groupId/media/search
exports.searchGroupMedia = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check membership
    const isMember = await prisma.groupMember.findFirst({
      where: { userId, groupId }
    });
    if (!isMember) {
      return res.status(403).json({ message: 'Forbidden. You are not a member of this group.' });
    }

    // Get all group members
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId }
    });
    const memberIds = groupMembers.map(m => m.userId);

    // Filters
    const { keyword, userId: filterUserId, fromDate, toDate, location } = req.query;

    const capsuleWhere = {
      userId: { in: memberIds },
      status: 'unlocked'
    };

    if (location) {
      capsuleWhere.OR = [
        { title: { contains: location } },
        { content: { contains: location } }
      ];
    }

    const capsules = await prisma.capsule.findMany({
      where: capsuleWhere,
      include: {
        creator: { select: { id: true, username: true, avatar: true } }
      }
    });

    const capsuleIds = capsules.map(c => c.id);
    const capsulesMap = {};
    capsules.forEach(c => {
      capsulesMap[c.id] = c;
    });

    // Get media files
    const mediaWhere = {
      diaryId: { in: capsuleIds }
    };

    if (filterUserId) {
      mediaWhere.userId = filterUserId;
    } else {
      mediaWhere.userId = { in: memberIds };
    }

    if (fromDate || toDate) {
      mediaWhere.createdAt = {};
      if (fromDate) mediaWhere.createdAt.gte = new Date(fromDate);
      if (toDate) mediaWhere.createdAt.lte = new Date(toDate);
    }

    const mediaFiles = await prisma.media.findMany({
      where: mediaWhere,
      orderBy: { createdAt: 'desc' }
    });

    // Populate uploader details
    const uploaderIds = Array.from(new Set(mediaFiles.map(m => m.userId)));
    const uploaders = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, username: true, avatar: true }
    });
    const uploadersMap = {};
    uploaders.forEach(u => {
      uploadersMap[u.id] = u;
    });

    // Format & map results
    let filteredMedia = mediaFiles.map(m => {
      const parentCapsule = capsulesMap[m.diaryId] || null;
      return {
        id: m.id,
        userId: m.userId,
        diaryId: m.diaryId,
        url: m.url,
        type: m.type,
        size: m.size,
        filename: m.filename,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        deletedAt: m.deletedAt,
        user: uploadersMap[m.userId] || null,
        capsule: parentCapsule ? {
          id: parentCapsule.id,
          title: parentCapsule.title,
          content: parentCapsule.content,
          open_at: parentCapsule.open_at,
          creator: parentCapsule.creator
        } : null
      };
    });

    // Apply keyword search
    if (keyword) {
      const kw = keyword.toLowerCase();
      filteredMedia = filteredMedia.filter(m => {
        const inFilename = m.filename ? m.filename.toLowerCase().includes(kw) : false;
        const inCapsuleTitle = m.capsule ? m.capsule.title.toLowerCase().includes(kw) : false;
        const inCapsuleContent = m.capsule && m.capsule.content ? m.capsule.content.toLowerCase().includes(kw) : false;
        return inFilename || inCapsuleTitle || inCapsuleContent;
      });
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
    const total = filteredMedia.length;
    const paginatedMedia = filteredMedia.slice(offset, offset + limit);

    return res.json({
      data: paginatedMedia,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};