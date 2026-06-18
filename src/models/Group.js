const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Group = sequelize.define('Group', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT },
  ownerId: { type: DataTypes.UUID, allowNull: false },
  inviteCode: { type: DataTypes.STRING(10), unique: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'groups' });

const GroupMember = sequelize.define('GroupMember', {
  userId: { type: DataTypes.UUID, allowNull: false },
  groupId: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.ENUM('owner', 'member'), defaultValue: 'member' },
  joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'group_members', timestamps: false, paranoid: false });

module.exports = { Group, GroupMember };