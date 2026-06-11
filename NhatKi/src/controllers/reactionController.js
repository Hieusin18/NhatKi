const { DataTypes }  = require('sequelize');
const sequelize      = require('../config/database');
const { DiaryEntry } = require('../models/index');

const Reaction = sequelize.define('Reaction', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:  { type: DataTypes.UUID, allowNull: false },
  diaryId: { type: DataTypes.UUID, allowNull: false },
  type:    { type: DataTypes.ENUM('like','love','sad','haha','angry'), defaultValue: 'like' },
}, { tableName: 'reactions', paranoid: false });

const Comment = sequelize.define('Comment', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:  { type: DataTypes.UUID, allowNull: false },
  diaryId: { type: DataTypes.UUID, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
}, { tableName: 'comments', paranoid: true });

sequelize.sync({ alter: true });

// POST /diary/:diaryId/reactions
exports.addReaction = async (req, res) => {
  try {
    const { diaryId } = req.params;
    const { type }    = req.body;
    const allowed     = ['like','love','sad','haha','angry'];

    if (type && !allowed.includes(type))
      return res.status(400).json({ message: `type must be: ${allowed.join(', ')}` });

    const diary = await DiaryEntry.findByPk(diaryId);
    if (!diary) return res.status(404).json({ message: 'Diary not found.' });

    const [reaction, created] = await Reaction.findOrCreate({
      where:    { userId: req.user.id, diaryId },
      defaults: { type: type || 'like' },
    });

    if (!created) await reaction.update({ type: type || 'like' });
    res.status(201).json({
      message: created ? 'Reaction added!' : 'Reaction updated!',
      data:    reaction,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /diary/:diaryId/reactions
exports.removeReaction = async (req, res) => {
  try {
    const reaction = await Reaction.findOne({
      where: { userId: req.user.id, diaryId: req.params.diaryId }
    });
    if (!reaction) return res.status(404).json({ message: 'Reaction not found.' });
    await reaction.destroy();
    res.json({ message: 'Reaction removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /diary/:diaryId/reactions
exports.getReactions = async (req, res) => {
  try {
    const reactions = await Reaction.findAll({
      where: { diaryId: req.params.diaryId },
    });
    res.json({ data: reactions, total: reactions.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /diary/:diaryId/comments
exports.addComment = async (req, res) => {
  try {
    const { diaryId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim())
      return res.status(400).json({ message: 'content is required.' });

    const diary = await DiaryEntry.findByPk(diaryId);
    if (!diary) return res.status(404).json({ message: 'Diary not found.' });

    const comment = await Comment.create({
      userId: req.user.id, diaryId, content: content.trim()
    });
    res.status(201).json({ message: 'Comment added!', data: comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /diary/:diaryId/comments
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { diaryId: req.params.diaryId },
      order: [['createdAt', 'ASC']],
    });
    res.json({ data: comments, total: comments.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /diary/:diaryId/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findOne({
      where: { id: req.params.commentId, userId: req.user.id }
    });
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    await comment.destroy();
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};