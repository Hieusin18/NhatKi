require('dotenv').config();
const { sequelize } = require('../models/index');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected!');
    await sequelize.sync({ alter: true });
    console.log('✅ Tables created!');
    console.log('   • users');
    console.log('   • groups');
    console.log('   • group_members');
    console.log('   • diary_entries');
    console.log('   • tags, diary_tags');
    console.log('   • media');
    console.log('   • capsules');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrate();