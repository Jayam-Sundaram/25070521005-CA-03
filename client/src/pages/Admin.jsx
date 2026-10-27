import { useState } from 'react';
import { api } from '../services/api.js';
import { useAsync } from '../hooks.js';
import { useApp } from '../context/AppContext.jsx';
import { Loading, ErrorState } from '../components/Parts.jsx';

const blank = { type: 'movie', seasons: '', collection: '', title: '', overview: '', releaseYear: '', runtime: '', genres: '', director: '', cast: '', posterUrl: '', backdropUrl: '', trailerUrl: '', popularity: 50 };

export default function Admin() {
  const { notify } = useApp();
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState(null); // null = closed; object = add/edit
  const stats = useAsync(() => api.admin.stats(), [tab]);
  const users = useAsync(() => api.admin.users(), [tab]);
  const movies = useAsync(() => api.admin.movies(), [tab, form === null]);

  const save = async e => {
    e.preventDefault();
    const body = { ...form, releaseYear: Number(form.releaseYear) || undefined, runtime: Number(form.runtime) || undefined, seasons: Number(form.seasons) || undefined, popularity: Number(form.popularity) || 0,
      genres: String(form.genres).split(',').map(s => s.trim()).filter(Boolean), cast: String(form.cast).split(',').map(s => s.trim()).filter(Boolean) };
    delete body._id; delete body.slug; delete body.createdAt; delete body.updatedAt; delete body.__v;
    try { form._id ? await api.admin.editMovie(form._id, body) : await api.admin.addMovie(body); notify('Movie saved'); setForm(null); }
    catch (err) { notify(err.message, 'err'); }
  };
  const del = async m => { if (!confirm(`Delete “${m.title}” and its reviews?`)) return; try { await api.admin.deleteMovie(m._id); notify('Movie deleted'); movies.reload(); } catch (e) { notify(e.message, 'err'); } };
  const f = k => ({ value: form[k] ?? '', onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return <div className="wrap section"><h1>Admin dashboard</h1>
    <div className="tabs" role="tablist">{['overview', 'movies', 'users'].map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => { setTab(t); setForm(null); }}>{t}</button>)}</div>
    {tab === 'overview' && (stats.loading ? <Loading /> : stats.error ? <ErrorState message={stats.error} retry={stats.reload} /> : <>
      <div className="stats"><div><b>{stats.data.users}</b>Users</div><div><b>{stats.data.movies}</b>Local titles</div><div><b>{stats.data.reviews}</b>Reviews</div></div>
      <h2>Recent reviews</h2>{stats.data.recentReviews.length ? <ul className="reviews">{stats.data.recentReviews.map(r => <li key={r.id}><strong>{r.userName}</strong> rated <code>{r.movieId}</code> {r.rating}/10{r.reviewText && <p>{r.reviewText}</p>}</li>)}</ul> : <p className="muted">No reviews yet.</p>}</>)}
    {tab === 'users' && (users.loading ? <Loading /> : users.error ? <ErrorState message={users.error} /> :
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
        <tbody>{users.data.users.map(u => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>)}
    {tab === 'movies' && (form ? <form className="admin-form" onSubmit={save}>
      <h2>{form._id ? 'Edit movie' : 'Add movie'}</h2>
      <div className="two"><label>Type<select {...f('type')}><option value="movie">Movie</option><option value="tv">TV series</option></select></label>
        <label>Seasons (series only)<input type="number" {...f('seasons')} /></label></div>
      <label>Title<input required {...f('title')} /></label>
      <label>Overview<textarea rows="3" {...f('overview')} /></label>
      <div className="two"><label>Year<input type="number" {...f('releaseYear')} /></label><label>Runtime (min)<input type="number" {...f('runtime')} /></label></div>
      <label>Collection (optional)<input {...f('collection')} /></label>
      <label>Genres (comma separated)<input {...f('genres')} /></label>
      <label>Director<input {...f('director')} /></label>
      <label>Cast (comma separated)<input {...f('cast')} /></label>
      <label>Poster URL<input {...f('posterUrl')} /></label><label>Backdrop URL<input {...f('backdropUrl')} /></label><label>Trailer embed URL<input {...f('trailerUrl')} /></label>
      <label>Popularity<input type="number" {...f('popularity')} /></label>
      <div className="actions"><button className="btn">Save movie</button><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button></div></form> :
      <>
        <button className="btn" onClick={() => setForm({ ...blank })}>Add movie</button>
        {movies.loading ? <Loading /> : movies.error ? <ErrorState message={movies.error} retry={movies.reload} /> :
          <div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Year</th><th>Genres</th><th></th></tr></thead>
            <tbody>{movies.data.movies.map(m => <tr key={m._id}><td>{m.title}</td><td>{m.type === 'tv' ? 'Series' : 'Movie'}</td><td>{m.releaseYear}</td><td>{m.genres.join(', ')}</td>
              <td className="row-actions"><button className="btn ghost sm" onClick={() => setForm({ ...m, genres: m.genres.join(', '), cast: (m.cast || []).join(', ') })}>Edit</button>
                <button className="btn ghost sm danger" onClick={() => del(m)}>Delete</button></td></tr>)}</tbody></table></div>}</>)}
  </div>;
}
