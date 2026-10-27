import { Router } from 'express';
import Review from '../models/Review.js';
import { wrap } from '../utils/AppError.js';
import AppError from '../utils/AppError.js';
import { requireAuth } from '../middleware/auth.js';
import { validateReview } from '../utils/validate.js';
import { listMovies, getGenres, getMovie, movieExists, communityStats, useTmdb } from '../services/movieService.js';
const r = Router();

r.get('/', wrap(async (req, res) => res.json(await listMovies(req.query))));
r.get('/search', wrap(async (req, res) => res.json(await listMovies(req.query))));
r.get('/genres', wrap(async (_req, res) => res.json({ genres: await getGenres(_req.query.type), source: useTmdb() ? 'tmdb' : 'local' })));
r.get('/:id', wrap(async (req, res) => res.json(await getMovie(req.params.id))));

r.get('/:movieId/reviews', wrap(async (req, res) => {
  const { movieId } = req.params;
  const page = Math.max(1, Number(req.query.page) || 1), limit = 10;
  const [reviews, total, stats] = await Promise.all([
    Review.find({ movieId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'name').lean(),
    Review.countDocuments({ movieId }), communityStats([movieId])]);
  res.json({ reviews: reviews.map(x => ({ id: x._id, userId: x.userId?._id, userName: x.userId?.name || 'Deleted user',
    rating: x.rating, reviewText: x.reviewText, createdAt: x.createdAt, updatedAt: x.updatedAt })),
    total, page, totalPages: Math.max(1, Math.ceil(total / limit)), stats: stats[movieId] || { average: 0, ratingCount: 0, reviewCount: 0 } });
}));
r.post('/:movieId/reviews', requireAuth, wrap(async (req, res) => {
  const data = validateReview(req.body);
  await movieExists(req.params.movieId);
  if (await Review.exists({ userId: req.user._id, movieId: req.params.movieId }))
    throw new AppError(409, 'You already reviewed this movie. Edit your existing review instead');
  const review = await Review.create({ ...data, userId: req.user._id, movieId: req.params.movieId });
  res.status(201).json({ review });
}));
export default r;
