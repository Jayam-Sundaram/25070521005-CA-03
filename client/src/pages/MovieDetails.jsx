import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAsync } from '../hooks.js';
import { useApp } from '../context/AppContext.jsx';
import { Poster, Rating, WatchBtn, Grid, Loading, ErrorState, HeroSection, ScoreRing } from '../components/Parts.jsx';

function Reviews({ movieId }) {
  const { user, notify } = useApp();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => api.reviews(movieId, page), [movieId, page]);
  const mine = data?.reviews.find(r => r.userId === user?.id);
  const [form, setForm] = useState({ rating: 8, reviewText: '' });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      if (editing) await api.editReview(mine.id, form); else await api.addReview(movieId, form);
      notify(editing ? 'Review updated' : 'Review posted'); setEditing(false); setForm({ rating: 8, reviewText: '' }); setPage(1); reload();
    } catch (err) { notify(err.message, 'err'); } finally { setBusy(false); }
  };
  const remove = async r => { if (!confirm('Delete your review?')) return; try { await api.deleteReview(r.id); notify('Review deleted'); reload(); } catch (err) { notify(err.message, 'err'); } };

  return <section className="section" id="reviews">
    <h2>Community reviews</h2>
    {data && <p className="muted">{data.stats.ratingCount ? `${data.stats.average}/10 average from ${data.stats.ratingCount} rating${data.stats.ratingCount > 1 ? 's' : ''} and ${data.stats.reviewCount} written review${data.stats.reviewCount === 1 ? '' : 's'}` : 'No ratings yet. Be the first.'}</p>}
    {!user ? <p><Link to="/login">Log in</Link> to rate and review.</p> : (!mine || editing) &&
      <form className="review-form" onSubmit={submit}>
        <label>Your rating: <strong>{form.rating}/10</strong>
          <input type="range" min="1" max="10" value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} /></label>
        <textarea rows="3" maxLength="2000" placeholder="Write a review (optional)" value={form.reviewText} onChange={e => setForm({ ...form, reviewText: e.target.value })} aria-label="Review text" />
        <div className="actions"><button className="btn" disabled={busy}>{editing ? 'Save changes' : 'Post review'}</button>
          {editing && <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>}</div>
      </form>}
    {loading ? <Loading /> : error ? <ErrorState message={error} retry={reload} /> : <>
      <ul className="reviews">{data.reviews.map(r => <li key={r.id}>
        <div className="review-top"><strong>{r.userName}</strong><span className="rating"><Star size={13} fill="currentColor" /> {r.rating}/10</span>
          <small className="muted">{new Date(r.createdAt).toLocaleDateString()}{r.updatedAt !== r.createdAt && ' (edited)'}</small>
          {r.userId === user?.id && <span className="review-actions">
            <button className="icon-btn" aria-label="Edit review" onClick={() => { setEditing(true); setForm({ rating: r.rating, reviewText: r.reviewText }); }}><Pencil size={15} /></button>
            <button className="icon-btn" aria-label="Delete review" onClick={() => remove(r)}><Trash2 size={15} /></button></span>}</div>
        {r.reviewText && <p>{r.reviewText}</p>}</li>)}</ul>
      {data.totalPages > 1 && <div className="pager"><button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Newer</button><span>{page}/{data.totalPages}</span>
        <button className="btn ghost" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Older</button></div>}</>}
  </section>;
}

export default function MovieDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => api.movie(id), [id]);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error === 'Movie not found' ? 'We couldn’t find that movie. It may have been removed.' : error} retry={reload} />;
  const m = data.movie;
  return <>
    <HeroSection movie={m} className="detail">
      <div className="hero-body detail-body">
        <Poster movie={m} className="big" />
        <div>
          <h1>{m.title}</h1>
          {m.tagline && <p className="muted">{m.tagline}</p>}
          <div className="ticket"><div className="ticket-main"><small>CINEVERSE / ADMIT ONE</small><ScoreRing movie={m} /></div>
            <div className="ticket-stub"><b>{m.releaseYear || '-'}</b><small>{m.type === 'tv' ? 'SERIES' : 'FILM'}</small></div></div>
          <p className="meta"><span>{m.releaseYear}</span>{m.type === 'tv' ? <span>{m.seasons ? `${m.seasons} season${m.seasons > 1 ? 's' : ''}` : 'Series'}</span> : m.runtime && <span>{Math.floor(m.runtime / 60)}h {m.runtime % 60}m</span>}<span>{m.genres.join(', ')}</span><Rating movie={m} /></p>
          <p className="lead">{m.overview || 'No overview available.'}</p>
          <dl className="facts">
            {m.director && <><dt>{m.type === 'tv' ? 'Created by' : 'Director'}</dt><dd>{m.director}</dd></>}
            {m.cast?.length > 0 && <><dt>Cast</dt><dd>{m.cast.join(', ')}</dd></>}
            {m.production?.length > 0 && <><dt>Production</dt><dd>{m.production.join(', ')}</dd></>}
          </dl>
          <WatchBtn movie={m} full />
          <p className="muted small">{m.source === 'tmdb' ? 'Details from TMDB.' : 'Details from the local CineVerse catalogue.'} Community ratings come from CineVerse users.</p>
        </div>
      </div>
    </HeroSection>
    <div className="wrap">
      {m.trailerUrl && <section className="section"><h2>Trailer</h2><div className="video"><iframe src={m.trailerUrl} title={`${m.title} trailer`} allowFullScreen loading="lazy" /></div></section>}
      <Reviews movieId={m.id} />
      {data.similar.length > 0 && <section className="section"><h2>You might also like</h2><Grid movies={data.similar.slice(0, 6)} /></section>}
    </div>
  </>;
}
