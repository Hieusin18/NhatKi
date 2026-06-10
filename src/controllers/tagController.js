const { Op }                   = require('sequelize');
const { Tag, DiaryEntry }      = require('../models/index');
const { buildVisibilityWhere } = require('../helpers/visibilityFilter');

// GET /tags
exports.getAll = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']],
    });
    res.json({ data: tags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /diary/:diaryId/tags
exports.attachTag = async (req, res) => {
  try {
    const { diaryId }  = req.params;
    const { tag_name } = req.body;

    if (!tag_name || !tag_name.trim())
      return res.status(400).json({ message: 'tag_name is required.' });

    const diary = await DiaryEntry.findOne({
      where: { id: diaryId, userId: req.user.id },
    });
    if (!diary) return res.status(404).json({ message: 'Diary not found.' });

    const [tag, created] = await Tag.findOrCreate({
      where: { userId: req.user.id, name: tag_name.trim().toLowerCase() },
    });

    await diary.addTag(tag);
    res.status(201).json({
      message: created ? `Tag "${tag.name}" created and attached!` : `Tag "${tag.name}" attached!`,
      data: tag,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /diary/:diaryId/tags/:tagId
exports.detachTag = async (req, res) => {
  try {
    const { diaryId, tagId } = req.params;

    const diary = await DiaryEntry.findOne({
      where: { id: diaryId, userId: req.user.id },
    });
    if (!diary) return res.status(404).json({ message: 'Diary not found.' });

    const tag = await Tag.findOne({ where: { id: tagId, userId: req.user.id } });
    if (!tag) return res.status(404).json({ message: 'Tag not found.' });

    await diary.removeTag(tag);
    res.json({ message: `Tag "${tag.name}" removed.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /diary/search?tag=keyword
exports.searchByTag = async (req, res) => {
  try {
    const { tag }  = req.query;
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(50, parseInt(req.query.limit) || 10);
    const offset   = (page - 1) * limit;

    if (!tag || !tag.trim())
      return res.status(400).json({ message: 'Missing query param: ?tag=' });

    const { count, rows } = await DiaryEntry.findAndCountAll({
      where:   { ...buildVisibilityWhere(req.user.id), deletedAt: null },
      include: [{
        model: Tag, as: 'tags',
        where: { name: { [Op.like]: `%${tag.trim().toLowerCase()}%` } },
        through: { attributes: [] },
        required: true,
      }],
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