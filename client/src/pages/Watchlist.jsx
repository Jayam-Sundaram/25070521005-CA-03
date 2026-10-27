import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAsync } from '../hooks.js';
import { useApp } from '../context/AppContext.jsx';
import { Grid, Loading, ErrorState, Empty } from '../components/Parts.jsx';
export default function Watchlist() {
  const { watchIds } = useApp();
  const { data, loading, error, reload } = useAsync(() => api.watchlist(), []);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={reload} />;
  const movies = data.movies.filter(m => watchIds.includes(m.id)); // reflects removals instantly
  return <div className="wrap section"><h1>Your watchlist</h1>
    {movies.length ? <Grid movies={movies} /> : <Empty title="Nothing saved yet" hint="Add movies from Discover and they’ll be waiting here."><Link className="btn" to="/discover">Find a movie</Link></Empty>}</div>;
}
