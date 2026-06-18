const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  avatar: { type: DataTypes.STRING(500) },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (u) => { u.password = await bcrypt.hash(u.password, 10); },
    beforeUpdate: async (u) => {
      if (u.changed('password')) u.password = await bcrypt.hash(u.password, 10);
    },
  },
});

User.prototype.checkPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

User.prototype.toJSON = function () {
  const v = { ...this.get() };
  delete v.password;
  return v;
};

module.exports = User;