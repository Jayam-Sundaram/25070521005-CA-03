import { Router } from 'express';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Review from '../models/Review.js';
import AppError, { wrap } from '../utils/AppError.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
const r = Router();
r.use(requireAuth, requireAdmin);
const slugify = t => 'local-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
const fields = ['type','seasons','collection','title','overview','releaseYear','runtime','genres','director','cast','posterUrl','backdropUrl','trailerUrl','popularity'];
const pick = b => Object.fromEntries(fields.filter(f => b[f] !== undefined).map(f => [f, b[f]]));

r.get('/stats', wrap(async (_req, res) => {
  const [users, movies, reviews, recent] = await Promise.all([User.countDocuments(), Movie.countDocuments(), Review.countDocuments(),
    Review.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name').lean()]);
  res.json({ users, movies, reviews, recentReviews: recent.map(x => ({ id: x._id, movieId: x.movieId, rating: x.rating, reviewText: x.reviewText, userName: x.userId?.name, createdAt: x.createdAt })) });
}));
r.get('/users', wrap(async (_req, res) => res.json({ users: await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean() })));
r.get('/movies', wrap(async (_req, res) => res.json({ movies: await Movie.find().sort({ createdAt: -1 }).lean() })));
r.post('/movies', wrap(async (req, res) => {
  if (!req.body.title?.trim()) throw new AppError(400, 'Title is required');
  res.status(201).json({ movie: await Movie.create({ ...pick(req.body), slug: slugify(req.body.title) }) });
}));
r.put('/movies/:id', wrap(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
  if (!movie) throw new AppError(404, 'Movie not found');
  res.json({ movie });
}));
r.delete('/movies/:id', wrap(async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) throw new AppError(404, 'Movie not found');
  await Review.deleteMany({ movieId: movie.slug });
  res.json({ message: 'Movie deleted' });
}));
export default r;
