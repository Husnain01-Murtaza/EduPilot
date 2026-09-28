// Creates the first super_admin: `npm run seed`
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

(async () => {
  await connectDB();
  const email = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env');

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'super_admin';
    await existing.save();
    console.log(`Promoted ${email} to super_admin`);
  } else {
    await User.create({ name: 'Super Admin', email, passwordHash: password, role: 'super_admin' });
    console.log(`Created super_admin ${email}`);
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
