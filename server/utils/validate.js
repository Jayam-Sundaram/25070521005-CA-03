import AppError from './AppError.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateRegistration({ name, email, password }) {
  if (typeof name !== 'string' || name.trim().length < 2) throw new AppError(400, 'Name must be at least 2 characters');
  if (typeof email !== 'string' || !EMAIL.test(email.trim())) throw new AppError(400, 'Enter a valid email address');
  if (typeof password !== 'string' || password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password))
    throw new AppError(400, 'Password must be 8+ characters with letters and a number');
}
export function validateReview({ rating, reviewText = '' }) {
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 10) throw new AppError(400, 'Rating must be a whole number from 1 to 10');
  if (typeof reviewText !== 'string' || reviewText.length > 2000) throw new AppError(400, 'Review must be 2000 characters or fewer');
  return { rating: r, reviewText: reviewText.trim() };
}
