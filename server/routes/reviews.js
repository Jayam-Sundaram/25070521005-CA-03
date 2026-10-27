import { Router } from 'express';
import Review from '../models/Review.js';
import AppError, { wrap } from '../utils/AppError.js';
import { requireAuth } from '../middleware/auth.js';
import { validateReview } from '../utils/validate.js';
const r = Router();
// Ownership check shared by edit and delete
async function ownReview(req) {
  const review = await Review.findById(req.params.reviewId);
  if (!review) throw new AppError(404, 'Review not found');
  if (String(review.userId) !== String(req.user._id) && req.user.role !== 'admin') throw new AppError(403, 'You can only change your own reviews');
  return review;
}
r.put('/:reviewId', requireAuth, wrap(async (req, res) => {
  const review = await ownReview(req);
  if (String(review.userId) !== String(req.user._id)) throw new AppError(403, 'Only the author can edit a review');
  Object.assign(review, validateReview(req.body));
  await review.save();
  res.json({ review });
}));
r.delete('/:reviewId', requireAuth, wrap(async (req, res) => {
  await (await ownReview(req)).deleteOne();
  res.json({ message: 'Review deleted' });
}));
export default r;
