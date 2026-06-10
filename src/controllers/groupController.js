const { Group, GroupMember, User } = require('../models/index');

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// POST /groups
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required.' });

    const group = await Group.create({
      name, description,
      ownerId:    req.user.id,
      inviteCode: genCode(),
    });

    await GroupMember.create({ userId: req.user.id, groupId: group.id, role: 'owner' });
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

    const group = await Group.findOne({ where: { inviteCode } });
    if (!group) return res.status(404).json({ message: 'Invalid invite code.' });

    const existed = await GroupMember.findOne({
      where: { userId: req.user.id, groupId: group.id }
    });
    if (existed) return res.status(409).json({ message: 'Already a member.' });

    await GroupMember.create({ userId: req.user.id, groupId: group.id, role: 'member' });
    res.json({ message: `Joined group "${group.name}"!`, data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /groups
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      include: [{
        model: User, as: 'members',
        through: { attributes: ['role', 'joinedAt'] },
        attributes: ['id', 'username', 'avatar'],
        where: { id: req.user.id },
      }],
    });
    res.json({ data: groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /groups/:id
exports.getOne = async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [{
        model: User, as: 'members',
        through: { attributes: ['role', 'joinedAt'] },
        attributes: ['id', 'username', 'avatar'],
      }],
    });
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    res.json({ data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /groups/:id/regenerate-code
exports.regenerateCode = async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { id: req.params.id, ownerId: req.user.id }
    });
    if (!group) return res.status(404).json({ message: 'Group not found or not owner.' });

    await group.update({ inviteCode: genCode() });
    res.json({ message: 'New invite code generated!', inviteCode: group.inviteCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};