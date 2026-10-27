import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: String, required: true }
}, { timestamps: true });
schema.index({ userId: 1, movieId: 1 }, { unique: true });
export default mongoose.model('Watchlist', schema);
