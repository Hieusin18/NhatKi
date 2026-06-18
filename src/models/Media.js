const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Media = sequelize.define('Media', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  diaryId: { type: DataTypes.UUID },
  url: { type: DataTypes.STRING(500), allowNull: false },
  type: { type: DataTypes.ENUM('image', 'video'), defaultValue: 'image' },
  size: { type: DataTypes.INTEGER },
  filename: { type: DataTypes.STRING(255) },
}, { tableName: 'media', paranoid: true });

module.exports = Media;