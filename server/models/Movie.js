import mongoose from 'mongoose';
// Locally stored movies: fallback catalogue + admin-managed records.
const schema = new mongoose.Schema({
  type: { type: String, enum: ['movie', 'tv'], default: 'movie' },
  seasons: Number,
  collection: String,
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  overview: { type: String, default: '' },
  releaseYear: { type: Number, min: 1888, max: 2100 },
  runtime: Number,
  genres: [String],
  director: String,
  cast: [String],
  posterUrl: String,
  backdropUrl: String,
  trailerUrl: String,
  popularity: { type: Number, default: 0 }
}, { timestamps: true });
export default mongoose.model('Movie', schema);
