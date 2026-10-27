import Movie from '../models/Movie.js';
import Review from '../models/Review.js';
import fallback from './fallback.js';
import AppError from '../utils/AppError.js';

// Both can be overridden in .env (e.g. TMDB_BASE_URL=https://api.tmdb.org/3) if your network blocks the default host.
const TMDB = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMG = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';
export const useTmdb = () => Boolean(process.env.TMDB_API_KEY);
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isTv = id => String(id).startsWith('tv-');
const rawId = id => String(id).replace(/^tv-/, '');

async function tmdb(path, params = {}) {
  const url = new URL(TMDB + path);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY);
  Object.entries(params).forEach(([k, v]) => v !== '' && v != null && url.searchParams.set(k, v));
  let r;
  try { r = await fetch(url); } catch { throw new AppError(502, 'Movie data provider is unreachable'); }
  if (r.status === 404) throw new AppError(404, 'Title not found');
  if (!r.ok) throw new AppError(502, 'Movie data provider returned an error');
  return r.json();
}

const genreCache = {};
async function tmdbGenres(kind = 'movie') {
  if (!genreCache[kind]) genreCache[kind] = (await tmdb(`/genre/${kind}/list`)).genres;
  return genreCache[kind];
}

const fromTmdb = (x, genreMap = {}, tv = false) => ({
  id: tv ? `tv-${x.id}` : String(x.id), type: tv ? 'tv' : 'movie',
  title: x.title || x.name, overview: x.overview,
  releaseYear: (x.release_date || x.first_air_date) ? Number((x.release_date || x.first_air_date).slice(0, 4)) : null,
  genres: (x.genres || (x.genre_ids || []).map(i => ({ name: genreMap[i] }))).map(g => g.name).filter(Boolean),
  tmdbRating: x.vote_average ? Math.round(x.vote_average * 10) / 10 : 0,
  popularity: x.popularity,
  posterUrl: x.poster_path ? `${IMG}/w780${x.poster_path}` : null,
  backdropUrl: x.backdrop_path ? `${IMG}/original${x.backdrop_path}` : null,
  source: 'tmdb'
});
const fromLocal = d => ({
  id: d.slug, type: d.type || 'movie', title: d.title, overview: d.overview, releaseYear: d.releaseYear,
  genres: d.genres, runtime: d.runtime, seasons: d.seasons, collection: d.collection, director: d.director, cast: d.cast,
  tmdbRating: 0, popularity: d.popularity, posterUrl: d.posterUrl, backdropUrl: d.backdropUrl,
  trailerUrl: d.trailerUrl, source: 'local'
});

// Adds any catalogue titles that are missing; never overwrites admin edits.
export async function seedFallback() {
  await Movie.bulkWrite(fallback.map(d => ({ updateOne: { filter: { slug: d.slug }, update: { $setOnInsert: d }, upsert: true } })));
}

// Community average is computed from our own database, never hardcoded.
export async function communityStats(ids) {
  const rows = await Review.aggregate([
    { $match: { movieId: { $in: ids } } },
    { $group: { _id: '$movieId', avg: { $avg: '$rating' }, count: { $sum: 1 },
      reviews: { $sum: { $cond: [{ $ne: ['$reviewText', ''] }, 1, 0] } } } }
  ]);
  return Object.fromEntries(rows.map(r => [r._id, { average: Math.round(r.avg * 10) / 10, ratingCount: r.count, reviewCount: r.reviews }]));
}
const attach = async movies => {
  const stats = await communityStats(movies.map(m => m.id));
  return movies.map(m => ({ ...m, community: stats[m.id] || { average: 0, ratingCount: 0, reviewCount: 0 } }));
};

export async function listMovies({ q = '', genre = '', year = '', minRating = 0, sort = 'popularity', page = 1, list = '', type = '', collection = '' }) {
  page = Math.max(1, Number(page) || 1);
  const pageSize = 20;
  if (useTmdb()) {
    if (collection) return { results: [], page, totalPages: 1, source: 'tmdb' };
    const tvMode = type === 'tv'; // TMDB mode: "all" shows movies; choose Series for TV
    const kind = tvMode ? 'tv' : 'movie';
    const genres = await tmdbGenres(kind);
    const map = Object.fromEntries(genres.map(g => [g.id, g.name]));
    let data;
    if (q) data = await tmdb(`/search/${kind}`, { query: q, page, [tvMode ? 'first_air_date_year' : 'year']: year });
    else if (list === 'trending') data = await tmdb(`/trending/${kind}/week`, { page });
    else if (list === 'top_rated') data = await tmdb(`/${kind}/top_rated`, { page });
    else {
      const dateKey = tvMode ? 'first_air_date' : 'primary_release_date';
      const sortMap = { popularity: 'popularity.desc', rating: 'vote_average.desc', year: `${dateKey}.desc` };
      const g = genres.find(x => x.name.toLowerCase() === String(genre).toLowerCase());
      data = await tmdb(`/discover/${kind}`, { page, sort_by: sortMap[sort] || sortMap.popularity, with_genres: g?.id,
        [tvMode ? 'first_air_date_year' : 'primary_release_year']: year, 'vote_average.gte': minRating || '', 'vote_count.gte': sort === 'rating' ? 300 : '' });
    }
    let results = data.results.map(x => fromTmdb(x, map, tvMode));
    if (q && genre) results = results.filter(m => m.genres.map(s => s.toLowerCase()).includes(String(genre).toLowerCase()));
    if (q && minRating) results = results.filter(m => m.tmdbRating >= Number(minRating));
    return { results: await attach(results), page, totalPages: Math.min(data.total_pages, 500), source: 'tmdb' };
  }
  const filter = {};
  if (q) filter.title = { $regex: esc(q), $options: 'i' };
  if (genre) filter.genres = { $regex: `^${esc(genre)}$`, $options: 'i' };
  if (year) filter.releaseYear = Number(year);
  if (type === 'tv') filter.type = 'tv'; else if (type === 'movie') filter.type = { $ne: 'tv' };
  if (collection) filter.collection = collection;
  const sortKey = { popularity: { popularity: -1 }, year: { releaseYear: -1 }, rating: { popularity: -1 } }[sort] || { popularity: -1 };
  const total = await Movie.countDocuments(filter);
  const docs = await Movie.find(filter).sort(sortKey).skip((page - 1) * pageSize).limit(pageSize).lean();
  let results = await attach(docs.map(fromLocal));
  if (minRating) results = results.filter(m => m.community.average >= Number(minRating));
  if (sort === 'rating') results.sort((a, b) => b.community.average - a.community.average);
  return { results, page, totalPages: Math.max(1, Math.ceil(total / pageSize)), source: 'local' };
}

export async function getGenres(type = '') {
  if (useTmdb()) return (await tmdbGenres(type === 'tv' ? 'tv' : 'movie')).map(g => g.name);
  return (await Movie.distinct('genres')).sort();
}

export async function getMovie(id) {
  if (useTmdb() && /^(tv-)?\d+$/.test(id)) {
    const tv = isTv(id), kind = tv ? 'tv' : 'movie', n = rawId(id);
    const [d, credits, videos, similar] = await Promise.all([
      tmdb(`/${kind}/${n}`), tmdb(`/${kind}/${n}/credits`), tmdb(`/${kind}/${n}/videos`), tmdb(`/${kind}/${n}/similar`)]);
    const movie = fromTmdb(d, {}, tv);
    const yt = videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
    Object.assign(movie, {
      runtime: tv ? d.episode_run_time?.[0] : d.runtime, seasons: tv ? d.number_of_seasons : undefined, tagline: d.tagline,
      director: tv ? d.created_by?.map(c => c.name).join(', ') || null : credits.crew.find(c => c.job === 'Director')?.name || null,
      cast: credits.cast.slice(0, 10).map(c => c.name),
      production: d.production_companies.map(c => c.name),
      trailerUrl: yt ? `https://www.youtube.com/embed/${yt.key}` : null
    });
    const sim = similar.results.slice(0, 8).map(x => fromTmdb(x, {}, tv));
    return { movie: (await attach([movie]))[0], similar: await attach(sim) };
  }
  const d = await Movie.findOne({ slug: id }).lean();
  if (!d) throw new AppError(404, 'Title not found');
  const sim = await Movie.find({ slug: { $ne: id }, type: d.type || 'movie', genres: { $in: d.genres } }).sort({ popularity: -1 }).limit(8).lean();
  return { movie: (await attach([fromLocal(d)]))[0], similar: await attach(sim.map(fromLocal)) };
}

export const movieExists = async id => { await getMovie(id); return true; };
