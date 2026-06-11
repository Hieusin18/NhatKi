const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Tag = sequelize.define('Tag', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  name:   {
    type:      DataTypes.STRING(100),
    allowNull: false,
    set(value) {
      this.setDataValue('name', value.trim().toLowerCase());
    },
  },
}, {
  tableName:  'tags',
  timestamps: false,
  paranoid:   false,
});

module.exports = Tag;