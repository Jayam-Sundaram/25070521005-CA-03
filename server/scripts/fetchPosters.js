// Fills in posterUrl for local titles using OMDb. Run: npm run fetch-posters
// Needs OMDB_API_KEY in .env. Skips titles that already have a poster (including ones you set in the admin panel).
import 'dotenv/config';
import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
const key = process.env.OMDB_API_KEY;
if (!key) { console.error('Set OMDB_API_KEY in .env first (free at omdbapi.com/apikey.aspx)'); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI);
let found = 0, missed = 0;
for (const m of await Movie.find({ $or: [{ posterUrl: null }, { posterUrl: '' }, { posterUrl: { $exists: false } }] })) {
  const url = new URL('https://www.omdbapi.com/');
  url.search = new URLSearchParams({ apikey: key, t: m.title, y: m.releaseYear || '', type: m.type === 'tv' ? 'series' : 'movie' });
  try {
    const d = await (await fetch(url)).json();
    if (d.Response === 'True' && d.Poster && d.Poster !== 'N/A') { m.posterUrl = d.Poster; await m.save(); found++; console.log('poster:', m.title); }
    else { missed++; console.log('no poster:', m.title); }
  } catch (e) { console.error('failed:', m.title, e.message); missed++; }
}
console.log(`Done. ${found} posters added, ${missed} without.`);
await mongoose.disconnect();
