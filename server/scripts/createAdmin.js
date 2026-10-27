// Creates (or promotes) the first admin using ADMIN_* values from .env. Run: npm run seed:admin
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) { console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env'); process.exit(1); }
await mongoose.connect(MONGODB_URI);
const email = ADMIN_EMAIL.toLowerCase();
const existing = await User.findOne({ email });
if (existing) { existing.role = 'admin'; await existing.save(); console.log('Existing user promoted to admin'); }
else { await User.create({ name: ADMIN_NAME || 'Admin', email, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: 'admin' }); console.log('Admin created'); }
await mongoose.disconnect();
