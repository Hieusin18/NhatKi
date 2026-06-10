const { Capsule, Media, User } = require('../models/index');
const { Op }                   = require('sequelize');

function formatCountdown(ms) {
  const days    = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  if (days > 0)    return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0)   return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// POST /capsules
exports.create = async (req, res) => {
  try {
    const { title, content, openAt, receiverId } = req.body;
    if (!title)  return res.status(400).json({ message: 'title is required.' });
    if (!openAt) return res.status(400).json({ message: 'openAt is required.' });
    if (new Date(openAt) <= new Date())
      return res.status(400).json({ message: 'openAt must be a future date.' });

    const capsule = await Capsule.create({
      userId: req.user.id, receiverId: receiverId || null,
      title, content, openAt, status: 'locked', isOpened: false,
    });
    res.status(201).json({ message: 'Capsule created!', data: capsule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /capsules
exports.getAll = async (req, res) => {
  try {
    const capsules = await Capsule.findAll({
      where:   { userId: req.user.id },
      order:   [['openAt', 'ASC']],
      include: [
        { model: User,  as: 'receiver', attributes: ['id', 'username', 'avatar'] },
        { model: Media, as: 'media' },
      ],
    });

    const now  = new Date();
    const data = capsules.map(c => {
      const obj    = c.toJSON();
      const diffMs = new Date(c.openAt) - now;
      obj.is_unlocked  = diffMs <= 0;
      obj.countdown_ms = diffMs > 0 ? diffMs : 0;
      obj.countdown    = diffMs > 0 ? formatCountdown(diffMs) : 'Ready to open!';
      return obj;
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /capsules/received
exports.getReceived = async (req, res) => {
  try {
    const capsules = await Capsule.findAll({
      where:   { receiverId: req.user.id },
      order:   [['openAt', 'ASC']],
      include: [
        { model: User,  as: 'creator', attributes: ['id', 'username', 'avatar'] },
        { model: Media, as: 'media' },
      ],
    });

    const now  = new Date();
    const data = capsules.map(c => {
      const obj    = c.toJSON();
      const diffMs = new Date(c.openAt) - now;
      obj.is_unlocked = diffMs <= 0;
      obj.countdown   = diffMs > 0 ? formatCountdown(diffMs) : 'Ready to open!';
      return obj;
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /capsules/:id
exports.getOne = async (req, res) => {
  try {
    const capsule = await Capsule.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [{ userId: req.user.id }, { receiverId: req.user.id }],
      },
      include: [
        { model: User,  as: 'receiver', attributes: ['id', 'username', 'avatar'] },
        { model: User,  as: 'creator',  attributes: ['id', 'username', 'avatar'] },
        { model: Media, as: 'media' },
      ],
    });
    if (!capsule) return res.status(404).json({ message: 'Capsule not found.' });

    const diffMs = new Date(capsule.openAt) - new Date();
    res.json({
      data: {
        ...capsule.toJSON(),
        is_unlocked:  diffMs <= 0,
        countdown:    diffMs > 0 ? formatCountdown(diffMs) : 'Ready to open!',
        countdown_ms: diffMs > 0 ? diffMs : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /capsules/:id/open
exports.open = async (req, res) => {
  try {
    const capsule = await Capsule.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [{ userId: req.user.id }, { receiverId: req.user.id }],
      },
      include: [{ model: Media, as: 'media' }],
    });
    if (!capsule) return res.status(404).json({ message: 'Capsule not found.' });

    if (new Date() < new Date(capsule.openAt))
      return res.status(403).json({
        message:   'Capsule is still locked.',
        countdown: formatCountdown(new Date(capsule.openAt) - new Date()),
      });

    await capsule.update({ isOpened: true, status: 'unlocked' });
    res.json({ message: 'Capsule opened!', data: capsule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /capsules/:id/media
exports.addMedia = async (req, res) => {
  try {
    const { url, type, filename, size, wishMessage } = req.body;
    if (!url) return res.status(400).json({ message: 'url is required.' });

    const capsule = await Capsule.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!capsule) return res.status(404).json({ message: 'Capsule not found.' });
    if (capsule.status === 'unlocked')
      return res.status(400).json({ message: 'Cannot add media to an opened capsule.' });

    const media = await Media.create({
      userId: req.user.id, diaryId: null,
      url, type: type || 'image', filename, size,
    });

    if (wishMessage) {
      const newContent = (capsule.content || '') + `\n\n💌 ${wishMessage}`;
      await capsule.update({ content: newContent });
    }

    res.status(201).json({ message: 'Media added to capsule!', data: media });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};