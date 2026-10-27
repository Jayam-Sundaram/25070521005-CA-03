import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Film, Search, Menu, X, Star, Plus, Check, User, LogOut, Shield, Bookmark } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useBackdrop, useCutout } from '../hooks.js';

export const hueOf = t => [...String(t)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

export function Navbar() {
  const { user, logout } = useApp();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const loc = useLocation();
  const go = e => { e.preventDefault(); if (q.trim()) { nav(`/discover?q=${encodeURIComponent(q.trim())}`); setOpen(false); } };
  const close = () => setOpen(false);
  return <header className="nav">
    <Link to="/" className="logo" onClick={close}><Film size={22} /> CineVerse</Link>
    <button className="icon-btn menu-btn" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    <nav className={`links ${open ? 'open' : ''}`} aria-label="Main">
      <NavLink to="/" end onClick={close}>Home</NavLink>
      <NavLink to="/discover" className={() => (loc.pathname === '/discover' && !loc.search.includes('type=') ? 'active' : '')} onClick={close}>Discover</NavLink>
      <NavLink to="/discover?type=movie" className={() => (loc.search.includes('type=movie') ? 'active' : '')} onClick={close}>Movies</NavLink>
      <NavLink to="/discover?type=tv" className={() => (loc.search.includes('type=tv') ? 'active' : '')} onClick={close}>TV Shows</NavLink>
      <NavLink to="/watchlist" onClick={close}>Watchlist</NavLink>
      <form onSubmit={go} className="search" role="search">
        <Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search movies" aria-label="Search movies" />
      </form>
      {user ? <>
        {user.role === 'admin' && <NavLink to="/admin" onClick={close}><Shield size={15} /> Admin</NavLink>}
        <span className="who"><User size={15} /> {user.name}</span>
        <button className="btn ghost sm" onClick={() => { logout(); close(); nav('/'); }}><LogOut size={14} /> Log out</button>
      </> : <>
        <NavLink to="/login" onClick={close}>Log in</NavLink>
        <Link to="/register" className="btn sm" onClick={close}>Register</Link>
      </>}
    </nav>
  </header>;
}

export function Footer() {
  return <footer className="footer">
    <div><strong className="logo"><Film size={18} /> CineVerse</strong><p>Your world of film. A full-stack CA project built with React, Express and MongoDB.</p></div>
    <div><Link to="/discover">Discover</Link><Link to="/watchlist">Watchlist</Link><Link to="/login">Account</Link></div>
    <p className="muted small">Movie metadata from TMDB when configured. Ratings and reviews are written by CineVerse users and stored in MongoDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
  </footer>;
}

export function Poster({ movie, className = '' }) {
  // Order: poster link from the database, then a file named after the movie in /public/posters, then generated art.
  const [fileMissing, setFileMissing] = useState(false);
  const src = movie.posterUrl || (movie.source === 'local' && !fileMissing ? `/posters/${movie.id}.jpg` : null);
  if (src) return <img className={`poster ${className}`} src={src} alt={`${movie.title} poster`} loading="lazy" onError={() => (movie.posterUrl ? null : setFileMissing(true))} />;
  return <div className={`poster ph ${className}`} style={{ '--h': hueOf(movie.title) }} role="img" aria-label={`${movie.title} (generated poster)`}>
    <span className="ph-kind">{movie.type === 'tv' ? 'Series' : movie.collection ? 'Marvel Studios' : 'Film'}</span>
    <strong>{movie.title}</strong>
    <span className="ph-year">{movie.releaseYear}</span>
  </div>;
}

export const Rating = ({ movie }) => {
  const c = movie.community;
  if (c?.ratingCount) return <span className="rating"><Star size={14} fill="currentColor" /> {c.average} <small>({c.ratingCount})</small></span>;
  if (movie.tmdbRating) return <span className="rating ext" title="Rating from TMDB"><Star size={14} /> {movie.tmdbRating} <small>TMDB</small></span>;
  return <span className="rating none">Not rated</span>;
};

export function WatchBtn({ movie, full }) {
  const { watchIds, toggleWatch } = useApp();
  const has = watchIds.includes(movie.id);
  return <button className={full ? `btn ${has ? 'ghost' : ''}` : 'icon-btn wl'} onClick={e => { e.preventDefault(); toggleWatch(movie); }}
    aria-pressed={has} aria-label={has ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}>
    {has ? <Check size={16} /> : <Plus size={16} />}{full && (has ? ' In watchlist' : ' Add to watchlist')}
  </button>;
}

export function MovieCard({ movie }) {
  return <article className="card" onMouseMove={e => { const r = e.currentTarget.querySelector('.pw').getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      e.currentTarget.style.setProperty('--rx', `${(-y * 12).toFixed(1)}deg`); e.currentTarget.style.setProperty('--ry', `${(x * 14).toFixed(1)}deg`); }}
    onMouseLeave={e => { e.currentTarget.style.setProperty('--rx', '0deg'); e.currentTarget.style.setProperty('--ry', '0deg'); }}>
    <Link to={`/movie/${encodeURIComponent(movie.id)}`} className="card-link">
      <div className="pw"><Poster movie={movie} />{movie.releaseYear >= 2024 && <span className="badge">NEW</span>}<div className="veil"><p>{movie.overview || 'No synopsis yet.'}</p><span className="veil-btn">View details</span></div></div>
      <div className="card-info"><h3>{movie.title}</h3>
        <p className="muted small">{movie.releaseYear || 'TBA'}{movie.genres?.[0] ? ` / ${movie.genres[0]}` : ''}{movie.type === 'tv' && <b className="tag">Series</b>}</p>
        <Rating movie={movie} /></div>
    </Link>
    <WatchBtn movie={movie} />
  </article>;
}

export const Loading = () => <div className="state"><div className="spinner" aria-label="Loading" /></div>;
export const ErrorState = ({ message, retry }) => <div className="state"><p>{message}</p>{retry && <button className="btn ghost" onClick={retry}>Try again</button>}</div>;
export const Empty = ({ title, hint, children }) => <div className="state"><Bookmark size={28} /><h3>{title}</h3><p className="muted">{hint}</p>{children}</div>;
export const Rail = ({ movies }) => <div className="rail">{movies.map(m => <MovieCard key={m.id} movie={m} />)}</div>;
export const Grid = ({ movies }) => <div className="grid">{movies.map(m => <MovieCard key={m.id} movie={m} />)}</div>;

export function HeroSection({ movie, className = '', children }) {
  const bd = useBackdrop(movie);
  return <section className={`hero ${className}`} onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`); }} style={{ '--h': hueOf(movie.title), ...(bd && { '--hero': `url(${bd})` }) }}>{children}</section>;
}

// Circular score: community average if people have rated it, otherwise the TMDB score.
export function ScoreRing({ movie }) {
  const c = movie.community, own = c?.ratingCount > 0;
  const v = own ? c.average : movie.tmdbRating || 0;
  return <div className="ring" aria-label={`Score ${v} out of 10`}>
    <svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" className="ring-bg" /><circle cx="22" cy="22" r="19" className="ring-fg" strokeDasharray={`${(v / 10) * 119.4} 119.4`} /></svg>
    <b>{v || '-'}</b><small>{own ? `${c.ratingCount} rating${c.ratingCount > 1 ? 's' : ''}` : v ? 'TMDB' : 'No ratings yet'}</small>
  </div>;
}

// 3D hero stage: layers sit at different depths and shift with the cursor, so the poster/cutout appears to float out of the frame.
export function Stage({ movie, children }) {
  const bd = useBackdrop(movie), cut = useCutout(movie);
  const move = e => {
    const el = e.currentTarget, r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
    el.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
  };
  const reset = e => { e.currentTarget.style.setProperty('--px', 0); e.currentTarget.style.setProperty('--py', 0); };
  return <section className={`stage ${cut ? 'has-cut' : ''}`} onMouseMove={move} onMouseLeave={reset} style={{ '--h': hueOf(movie.title) }}>
    <div className="stage-frame">
      <div className="stage-bg" style={bd ? { backgroundImage: `url(${bd})` } : undefined} />
      {cut ? <img className="stage-cut" src={cut} alt="" /> : <Poster movie={movie} className="stage-poster" />}
      <div className="stage-text">{children}</div>
    </div>
  </section>;
}

// Mosaic tile: poster fills the tile, text sits on a gradient. The first tile is larger and shows the synopsis.
export function Tile({ movie, big }) {
  return <article className={`tile ${big ? 'big' : ''}`}>
    <Link to={`/movie/${encodeURIComponent(movie.id)}`} className="tile-link card-link" aria-label={movie.title}>
      <Poster movie={movie} />
      <div className="tile-info">
        <div className="tile-tags">{movie.type === 'tv' && <b className="tag">Series</b>}{movie.releaseYear >= 2024 && <b className="tag new">New</b>}</div>
        <h3>{movie.title}</h3>
        <p className="muted small">{movie.releaseYear}{movie.genres?.length ? ` / ${movie.genres.slice(0, 2).join(', ')}` : ''}</p>
        {big && <p className="tile-lead">{movie.overview}</p>}
        <Rating movie={movie} />
      </div>
    </Link>
    <WatchBtn movie={movie} />
  </article>;
}
