import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError, { wrap } from '../utils/AppError.js';
export const requireAuth = wrap(async (req, _res, next) => {
  const token = req.cookies?.token;
  if (!token) throw new AppError(401, 'Please log in to continue');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { throw new AppError(401, 'Session expired. Please log in again'); }
  const user = await User.findById(payload.id).select('-passwordHash');
  if (!user) throw new AppError(401, 'Account no longer exists');
  req.user = user;
  next();
});
export const requireAdmin = (req, _res, next) =>
  req.user?.role === 'admin' ? next() : next(new AppError(403, 'Administrator access required'));
