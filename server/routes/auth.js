import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError, { wrap } from '../utils/AppError.js';
import { validateRegistration } from '../utils/validate.js';
import { requireAuth } from '../middleware/auth.js';
const r = Router();
const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 864e5 };
const publicUser = u => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const issue = (res, u) => res.cookie('token', jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' }), cookieOpts);

r.post('/register', wrap(async (req, res) => {
  validateRegistration(req.body);
  const email = req.body.email.trim().toLowerCase();
  if (await User.exists({ email })) throw new AppError(409, 'An account with this email already exists');
  // role is never read from the request: public sign-up always creates a normal user
  const user = await User.create({ name: req.body.name.trim(), email, passwordHash: await bcrypt.hash(req.body.password, 12) });
  issue(res, user);
  res.status(201).json({ user: publicUser(user) });
}));
r.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = typeof email === 'string' && typeof password === 'string' && await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, 'Incorrect email or password');
  issue(res, user);
  res.json({ user: publicUser(user) });
}));
r.post('/logout', (_req, res) => { res.clearCookie('token', { ...cookieOpts, maxAge: undefined }); res.json({ message: 'Logged out' }); });
r.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
export default r;
