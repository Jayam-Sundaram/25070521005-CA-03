// Single place for all backend calls. Cookies are sent automatically (credentials: 'include').
async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch('/api' + path, { method, credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  } catch { throw new Error('Cannot reach the server. Check that the backend is running.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.message || 'Request failed'); e.status = res.status; throw e; }
  return data;
}
const qs = o => { const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== '' && v != null)); return p.toString() ? '?' + p : ''; };
export const api = {
  register: b => request('/auth/register', { method: 'POST', body: b }),
  login: b => request('/auth/login', { method: 'POST', body: b }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  movies: p => request('/movies' + qs(p)),
  genres: () => request('/movies/genres'),
  movie: id => request(`/movies/${encodeURIComponent(id)}`),
  reviews: (id, page = 1) => request(`/movies/${encodeURIComponent(id)}/reviews?page=${page}`),
  addReview: (id, b) => request(`/movies/${encodeURIComponent(id)}/reviews`, { method: 'POST', body: b }),
  editReview: (id, b) => request(`/reviews/${id}`, { method: 'PUT', body: b }),
  deleteReview: id => request(`/reviews/${id}`, { method: 'DELETE' }),
  watchlist: () => request('/watchlist'),
  addWatch: id => request(`/watchlist/${encodeURIComponent(id)}`, { method: 'POST' }),
  removeWatch: id => request(`/watchlist/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  admin: {
    stats: () => request('/admin/stats'), users: () => request('/admin/users'), movies: () => request('/admin/movies'),
    addMovie: b => request('/admin/movies', { method: 'POST', body: b }),
    editMovie: (id, b) => request(`/admin/movies/${id}`, { method: 'PUT', body: b }),
    deleteMovie: id => request(`/admin/movies/${id}`, { method: 'DELETE' })
  }
};
