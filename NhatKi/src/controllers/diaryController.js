const { Op }                    = require('sequelize');
const { DiaryEntry, Tag, User } = require('../models/index');
const { buildVisibilityWhere }  = require('../helpers/visibilityFilter');

// POST /diary
exports.create = async (req, res) => {
  try {
    const { title, content, mood, visibility, entryDate } = req.body;
    if (!title)     return res.status(400).json({ message: 'title is required.' });
    if (!entryDate) return res.status(400).json({ message: 'entryDate is required.' });

    const diary = await DiaryEntry.create({
      userId: req.user.id, title, content, mood,
      visibility: visibility || 'private', entryDate,
    });
    res.status(201).json({ message: 'Diary created!', data: diary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /diary/timeline
exports.getTimeline = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const ownerId     = req.query.userId || null;
    const page        = Math.max(1, parseInt(req.query.page)  || 1);
    const limit       = Math.min(50, parseInt(req.query.limit) || 10);
    const offset      = (page - 1) * limit;

    const where = { ...buildVisibilityWhere(requesterId, ownerId), deletedAt: null };

    if (req.query.from || req.query.to) {
      where.entryDate = {};
      if (req.query.from) where.entryDate[Op.gte] = req.query.from;
      if (req.query.to)   where.entryDate[Op.lte] = req.query.to;
    }

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

// GET /diary/:id
exports.getOne = async (req, res) => {
  try {
    const diary = await DiaryEntry.findByPk(req.params.id, {
      include: [
        { model: Tag,  as: 'tags',   through: { attributes: [] } },
        { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
      ],
    });
    if (!diary) return res.status(404).json({ message: 'Diary not found.' });

    const isOwner = diary.userId === req.user.id;
    if (!isOwner && diary.visibility === 'private')
      return res.status(403).json({ message: 'Access denied.' });

    res.json({ data: diary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /diary/:id
exports.update = async (req, res) => {
  try {
    const diary = await DiaryEntry.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!diary) return res.status(404).json({ message: 'Diary not found.' });

    const { title, content, mood, entryDate } = req.body;
    await diary.update({ title, content, mood, entryDate });
    res.json({ message: 'Diary updated!', data: diary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /diary/:id
exports.remove = async (req, res) => {
  try {
    const diary = await DiaryEntry.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!diary) return res.status(404).json({ message: 'Diary not found.' });
    await diary.destroy();
    res.json({ message: 'Diary deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /diary/:id/visibility
exports.updateVisibility = async (req, res) => {
  try {
    const { visibility } = req.body;
    const allowed        = ['public', 'private', 'group'];
    if (!allowed.includes(visibility))
      return res.status(400).json({ message: `visibility must be: ${allowed.join(', ')}` });

    const diary = await DiaryEntry.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!diary) return res.status(404).json({ message: 'Diary not found.' });

    await diary.update({ visibility });
    res.json({ message: `Visibility updated to "${visibility}"`, data: { id: diary.id, visibility } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};