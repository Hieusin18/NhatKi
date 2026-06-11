const sequelize              = require('../config/database');
const User                   = require('./User');
const { Group, GroupMember } = require('./Group');
const Media                  = require('./Media');
const Capsule                = require('./Capsule');
const DiaryEntry             = require('./DiaryEntry');
const Tag                    = require('./Tag');

// User ↔ Group
User.belongsToMany(Group, { through: GroupMember, foreignKey: 'userId', as: 'groups' });
Group.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId', as: 'members' });
Group.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User ↔ DiaryEntry
User.hasMany(DiaryEntry, { foreignKey: 'userId', as: 'diaries' });
DiaryEntry.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// DiaryEntry ↔ Tag
DiaryEntry.belongsToMany(Tag, { through: 'diary_tags', foreignKey: 'diary_id', otherKey: 'tag_id', as: 'tags', timestamps: false });
Tag.belongsToMany(DiaryEntry, { through: 'diary_tags', foreignKey: 'tag_id', otherKey: 'diary_id', as: 'diaries', timestamps: false });

// DiaryEntry ↔ Media
DiaryEntry.hasMany(Media, { foreignKey: 'diaryId', as: 'media' });
Media.belongsTo(DiaryEntry, { foreignKey: 'diaryId' });

// User ↔ Capsule
User.hasMany(Capsule, { foreignKey: 'userId', as: 'capsules' });
Capsule.belongsTo(User, { foreignKey: 'userId', as: 'creator' });
Capsule.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Capsule ↔ Media
Capsule.hasMany(Media, { foreignKey: 'diaryId', as: 'media' });
Media.belongsTo(Capsule, { foreignKey: 'diaryId', as: 'capsule' });

module.exports = { sequelize, User, Group, GroupMember, Media, Capsule, DiaryEntry, Tag };