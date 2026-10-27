import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: String, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 10 },
  reviewText: { type: String, trim: true, maxlength: 2000, default: '' }
}, { timestamps: true });
schema.index({ userId: 1, movieId: 1 }, { unique: true }); // one review per user per movie
export default mongoose.model('Review', schema);
