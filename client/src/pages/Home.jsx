import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shuffle, Play } from 'lucide-react';
import { api } from '../services/api.js';
import { useAsync } from '../hooks.js';
import { Rail, Loading, ErrorState, WatchBtn, Rating, Stage, MovieCard, Tile, hueOf } from '../components/Parts.jsx';
import { useApp } from '../context/AppContext.jsx';

const MOODS = [
  { label: 'Edge of my seat', genres: ['Thriller', 'Horror', 'Mystery'] },
  { label: 'Need a laugh', genres: ['Comedy'] },
  { label: 'Mind-bending', genres: ['Sci-Fi', 'Science Fiction', 'Fantasy'] },
  { label: 'Pure adrenaline', genres: ['Action', 'Adventure'] },
  { label: 'In my feelings', genres: ['Drama', 'Romance'] }
];

// Mood picker: maps a feeling to genres, queries the API for each and shows a shuffled mix.
function MoodPicker({ genres }) {
  const [mood, setMood] = useState(null);
  const [res, setRes] = useState(null);
  const pick = async m => {
    setMood(m.label); setRes(null);
    const avail = m.genres.filter(g => genres.some(x => x.toLowerCase() === g.toLowerCase()));
    try {
      const all = await Promise.all(avail.map(g => api.movies({ genre: g })));
      const seen = new Set();
      const list = all.flatMap(r => r.results).filter(x => !seen.has(x.id) && seen.add(x.id));
      setRes(list.sort(() => Math.random() - 0.5).slice(0, 8));
    } catch { setRes([]); }
  };
  return <section className="section"><h2>What’s your mood tonight?</h2>
    <div className="moods">{MOODS.map(m => <button key={m.label} className={`mood ${mood === m.label ? 'on' : ''}`} onClick={() => pick(m)}>{m.label}</button>)}</div>
    {mood && (res === null ? <Loading /> : res.length ? <Rail movies={res} /> : <p className="muted">Nothing found for this mood yet.</p>)}
  </section>;
}

function Top10({ movies }) {
  if (!movies?.length) return null;
  return <section className="section"><div className="row-head"><h2>Trending now <span className="pill">Top 10</span></h2><Link to="/discover?sort=popularity">See all</Link></div>
    <div className="rail top10">{movies.slice(0, 10).map((m, i) => <div className="t10" key={m.id}><span className="num" aria-hidden="true">{i + 1}</span><MovieCard movie={m} /></div>)}</div></section>;
}

function Showcase({ tabs }) {
  const [k, setK] = useState(tabs[0].key);
  const list = (tabs.find(t => t.key === k) || tabs[0]).movies.slice(0, 7);
  return <section className="section"><div className="tabbar" role="tablist">{tabs.map(t => <button key={t.key} role="tab" aria-selected={k === t.key} className={k === t.key ? 'on' : ''} onClick={() => setK(t.key)}>{t.label}</button>)}</div>
    {list.length ? <div className="bento">{list.map((m, i) => <Tile key={m.id} movie={m} big={i === 0} />)}</div> : <p className="muted">Nothing here yet.</p>}</section>;
}

function Row({ title, movies, more }) {
  if (!movies?.length) return null;
  return <section className="section"><div className="row-head"><h2>{title}</h2><Link to={more}>See all</Link></div><Rail movies={movies} /></section>;
}

export default function Home() {
  const { user } = useApp();
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused) return; const t = setInterval(() => setIdx(i => i + 1), 7000); return () => clearInterval(t); }, [paused]);
  const { data, loading, error, reload } = useAsync(async () => {
    const [trending, top, popular, genres, series, marvel, horror] = await Promise.all([
      api.movies({ list: 'trending' }), api.movies({ list: 'top_rated', sort: 'rating' }), api.movies({ type: 'movie', sort: 'popularity' }), api.genres(),
      api.movies({ type: 'tv', list: 'trending' }), api.movies({ collection: 'Marvel Cinematic Universe', sort: 'year' }), api.movies({ genre: 'Horror' })]);
    // "Recommended": pick the user's most-watchlisted genre, otherwise a different slice of popular movies
    let rec = popular.results.slice(6, 12);
    if (user) {
      const wl = await api.watchlist().catch(() => ({ movies: [] }));
      const counts = {}; wl.movies.forEach(m => m.genres.forEach(g => counts[g] = (counts[g] || 0) + 1));
      const fav = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (fav) rec = (await api.movies({ genre: fav })).results.filter(m => !wl.ids.includes(m.id));
    }
    return { horror: horror.results, series: series.results, marvel: marvel.results, trending: trending.results, top: top.results, popular: popular.results, genres: genres.genres, rec };
  }, [user?.id]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={reload} />;
  const seen = new Set();
  const heroes = [...data.trending, ...data.series].sort((a, b) => b.popularity - a.popularity).filter(x => !seen.has(x.id) && seen.add(x.id)).slice(0, 5);
  const cur = heroes.length ? idx % heroes.length : 0;
  const hero = heroes[cur] || data.popular[0];
  return <>
    {hero && <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}><Stage key={hero.id} movie={hero}>
        <p className="kicker">{hero.type === 'tv' ? 'Featured series' : 'Featured film'}</p>
        <h1>{hero.title}</h1>
        <p className="meta"><span>{hero.releaseYear}</span><span>{hero.genres.slice(0, 3).join(', ')}</span><Rating movie={hero} /></p>
        <p className="lead">{hero.overview}</p>
        <div className="actions"><Link className="play" to={`/movie/${encodeURIComponent(hero.id)}`} aria-label={`Open ${hero.title}`}><Play size={22} fill="currentColor" /></Link>
          <Link to={`/movie/${encodeURIComponent(hero.id)}`} className="btn">Explore {hero.type === 'tv' ? 'series' : 'movie'}</Link><WatchBtn movie={hero} full />
          <button className="btn ghost" onClick={() => { const all = [...data.popular, ...data.series, ...data.trending]; nav(`/movie/${encodeURIComponent(all[Math.floor(Math.random() * all.length)].id)}`); }}><Shuffle size={16} /> Surprise me</button></div>
        <div className="dots" role="tablist" aria-label="Featured titles">{heroes.map((h, i) => <button key={h.id} role="tab" aria-selected={i === cur} aria-label={`Show ${h.title}`} className={i === cur ? 'on' : ''} onClick={() => setIdx(i)} />)}</div>
      </Stage></div>}
    <div className="marquee" aria-hidden="true"><div>{Array(4).fill('NOW SHOWING ✦ TRENDING ✦ BINGE-WORTHY ✦ CRITICALLY ACCLAIMED ✦ FAN FAVOURITES ✦ ').join('')}</div></div>
    <div className="wrap">
      <Showcase tabs={[
        { key: 'new', label: 'New releases', movies: [...data.popular, ...data.series].filter(m => m.releaseYear >= 2024).sort((a, b) => b.releaseYear - a.releaseYear || b.popularity - a.popularity) },
        { key: 'top', label: 'Top rated', movies: data.top }, { key: 'tv', label: 'TV series', movies: data.series },
        { key: 'horror', label: 'Horror', movies: data.horror }, { key: 'marvel', label: 'Marvel', movies: data.marvel }]} />
      <Top10 movies={data.trending} />
      <Row title="Binge-worthy series" movies={data.series} more="/discover?type=tv" />
      <Row title="Horror nights" movies={data.horror} more="/discover?genre=Horror" />
      <Row title="Marvel Cinematic Universe" movies={data.marvel} more="/discover?collection=Marvel%20Cinematic%20Universe&sort=year" />
      <Row title="Top-rated" movies={data.top} more="/discover?sort=rating" />
      <Row title="Popular" movies={data.popular} more="/discover?type=movie" />
      <Row title="Recommended for you" movies={data.rec} more="/discover" />
      <MoodPicker genres={data.genres} />
      <section className="section"><h2>Browse by genre</h2>
        <div className="chips">{data.genres.map(g => <Link key={g} className="chip" style={{ '--h': hueOf(g) }} to={`/discover?genre=${encodeURIComponent(g)}`}>{g}</Link>)}</div></section>
    </div>
  </>;
}
