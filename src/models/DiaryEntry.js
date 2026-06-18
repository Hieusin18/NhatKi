const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiaryEntry = sequelize.define('DiaryEntry', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  content: { type: DataTypes.TEXT },
  mood: { type: DataTypes.ENUM('happy', 'sad', 'neutral', 'excited', 'angry', 'anxious') },
  visibility: { type: DataTypes.ENUM('public', 'private', 'group'), defaultValue: 'private' },
  entryDate: { type: DataTypes.DATEONLY, allowNull: false },
}, {
  tableName: 'diary_entries',
  paranoid: true,
});

module.exports = DiaryEntry;