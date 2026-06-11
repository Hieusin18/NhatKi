const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Capsule = sequelize.define('Capsule', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:     { type: DataTypes.UUID, allowNull: false },
  receiverId: { type: DataTypes.UUID },
  title:      { type: DataTypes.STRING(255), allowNull: false },
  content:    { type: DataTypes.TEXT },
  openAt:     { type: DataTypes.DATE, allowNull: false },
  isOpened:   { type: DataTypes.BOOLEAN, defaultValue: false },
  status:     { type: DataTypes.ENUM('locked', 'unlocked'), defaultValue: 'locked' },
}, { tableName: 'capsules', paranoid: true });

module.exports = Capsule;