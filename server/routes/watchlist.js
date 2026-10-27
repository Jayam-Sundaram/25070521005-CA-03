import { Router } from 'express';
import Watchlist from '../models/Watchlist.js';
import { wrap } from '../utils/AppError.js';
import { requireAuth } from '../middleware/auth.js';
import { getMovie, movieExists } from '../services/movieService.js';
const r = Router();
r.use(requireAuth);
r.get('/', wrap(async (req, res) => {
  const items = await Watchlist.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  const movies = await Promise.all(items.map(i => getMovie(i.movieId).then(d => d.movie).catch(() => null)));
  res.json({ ids: items.map(i => i.movieId), movies: movies.filter(Boolean) });
}));
r.post('/:movieId', wrap(async (req, res) => {
  await movieExists(req.params.movieId);
  // upsert keeps the operation idempotent: no duplicates even on double-click
  await Watchlist.updateOne({ userId: req.user._id, movieId: req.params.movieId }, { $setOnInsert: {} }, { upsert: true });
  res.status(201).json({ message: 'Added to watchlist' });
}));
r.delete('/:movieId', wrap(async (req, res) => {
  await Watchlist.deleteOne({ userId: req.user._id, movieId: req.params.movieId });
  res.json({ message: 'Removed from watchlist' });
}));
export default r;
