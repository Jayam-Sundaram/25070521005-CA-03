import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAsync } from '../hooks.js';
import { Grid, Loading, ErrorState, Empty } from '../components/Parts.jsx';

export default function Discover() {
  const [sp, setSp] = useSearchParams();
  const f = { collection: sp.get('collection') || '', type: sp.get('type') || '', q: sp.get('q') || '', genre: sp.get('genre') || '', year: sp.get('year') || '', minRating: sp.get('minRating') || '', sort: sp.get('sort') || 'popularity', page: Number(sp.get('page')) || 1 };
  const [text, setText] = useState(f.q);
  useEffect(() => setText(f.q), [f.q]);
  const { data: g } = useAsync(() => api.genres(f.type), [f.type]);
  const { data, loading, error, reload } = useAsync(() => api.movies(f), [sp.toString()]);

  const set = (patch) => { const n = { ...f, page: 1, ...patch }; const p = {}; Object.entries(n).forEach(([k, v]) => { if (v && !(k === 'sort' && v === 'popularity') && !(k === 'page' && v === 1)) p[k] = v; }); setSp(p); };
  const years = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i);

  return <div className="wrap section">
    <h1>{f.collection ? f.collection : f.type === 'tv' ? 'TV shows' : f.type === 'movie' ? 'Movies' : 'Discover'}</h1>
    <form className="filters" onSubmit={e => { e.preventDefault(); set({ q: text.trim() }); }}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Search by title" aria-label="Search by title" />
      <select value={f.type} onChange={e => set({ type: e.target.value, genre: '' })} aria-label="Type"><option value="">Movies and series</option><option value="movie">Movies</option><option value="tv">TV series</option></select>
      <select value={f.genre} onChange={e => set({ genre: e.target.value })} aria-label="Genre"><option value="">All genres</option>{g?.genres.map(x => <option key={x}>{x}</option>)}</select>
      <select value={f.year} onChange={e => set({ year: e.target.value })} aria-label="Release year"><option value="">Any year</option>{years.map(y => <option key={y}>{y}</option>)}</select>
      <select value={f.minRating} onChange={e => set({ minRating: e.target.value })} aria-label="Minimum rating"><option value="">Any rating</option>{[5, 6, 7, 8, 9].map(r => <option key={r} value={r}>{r}+ stars</option>)}</select>
      <select value={f.sort} onChange={e => set({ sort: e.target.value })} aria-label="Sort by"><option value="popularity">Most popular</option><option value="rating">Highest rated</option><option value="year">Newest</option></select>
      <button className="btn">Search</button>
      <button type="button" className="btn ghost" onClick={() => setSp({})}>Reset</button>
    </form>
    {loading ? <Loading /> : error ? <ErrorState message={error} retry={reload} /> :
      !data.results.length ? <Empty title="No movies match" hint="Try a different title or loosen the filters." /> : <>
        <Grid movies={data.results} />
        <div className="pager"><button className="btn ghost" disabled={f.page <= 1} onClick={() => set({ page: f.page - 1 })}>Previous</button>
          <span>Page {data.page} of {data.totalPages}</span>
          <button className="btn ghost" disabled={f.page >= data.totalPages} onClick={() => set({ page: f.page + 1 })}>Next</button></div></>}
  </div>;
}
