const { Op }                             = require('sequelize');
const { DiaryEntry, Tag, User, GroupMember } = require('../models/index');
const { buildVisibilityWhere }           = require('../helpers/visibilityFilter');

// GET /feed/timeline
exports.getTimeline = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const where = { ...buildVisibilityWhere(req.user.id), deletedAt: null };

    const { count, rows } = await DiaryEntry.findAndCountAll({
      where,
      include: [
        { model: Tag,  as: 'tags',   through: { attributes: [] } },
        { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
      ],
      order: [['entryDate', 'DESC']], limit, offset, distinct: true,
    });

    res.json({
      data: rows,
      meta: { total: count, page, limit, total_pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /feed/group/:groupId
exports.getGroupFeed = async (req, res) => {
  try {
    const { groupId } = req.params;
    const page        = Math.max(1, parseInt(req.query.page)  || 1);
    const limit       = Math.min(50, parseInt(req.query.limit) || 10);
    const offset      = (page - 1) * limit;

    const member = await GroupMember.findOne({
      where: { userId: req.user.id, groupId }
    });
    if (!member) return res.status(403).json({ message: 'Not a member of this group.' });

    const members   = await GroupMember.findAll({ where: { groupId } });
    const memberIds = members.map(m => m.userId);

    const { count, rows } = await DiaryEntry.findAndCountAll({
      where: {
        userId:     { [Op.in]: memberIds },
        visibility: { [Op.in]: ['public', 'group'] },
        deletedAt:  null,
      },
      include: [
        { model: Tag,  as: 'tags',   through: { attributes: [] } },
        { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
      ],
      order: [['entryDate', 'DESC']], limit, offset, distinct: true,
    });

    res.json({
      data: rows,
      meta: {
        total: count, page, limit,
        total_pages: Math.ceil(count / limit),
        has_next: page < Math.ceil(count / limit),
        has_prev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};