import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [watchIds, setWatchIds] = useState([]);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = 'ok') => {
    setToast({ message, type, key: Date.now() });
    setTimeout(() => setToast(t => (t && Date.now() - t.key >= 3000 ? null : t)), 3100);
  }, []);

  const loadWatch = useCallback(() => api.watchlist().then(d => setWatchIds(d.ids)).catch(() => setWatchIds([])), []);
  useEffect(() => { api.me().then(d => { setUser(d.user); loadWatch(); }).catch(() => {}).finally(() => setReady(true)); }, [loadWatch]);

  const login = u => { setUser(u); loadWatch(); };
  const logout = async () => { await api.logout().catch(() => {}); setUser(null); setWatchIds([]); notify('Logged out'); };

  const toggleWatch = async movie => {
    if (!user) return notify('Log in to use your watchlist', 'err');
    const has = watchIds.includes(movie.id);
    try {
      if (has) { await api.removeWatch(movie.id); setWatchIds(ids => ids.filter(i => i !== movie.id)); notify('Removed from watchlist'); }
      else { await api.addWatch(movie.id); setWatchIds(ids => [...ids, movie.id]); notify('Added to watchlist'); }
    } catch (e) { notify(e.message, 'err'); }
  };

  return <Ctx.Provider value={{ user, ready, login, logout, watchIds, toggleWatch, notify }}>
    {children}
    {toast && <div className={`toast ${toast.type}`} role="status" aria-live="polite" key={toast.key}>{toast.message}</div>}
  </Ctx.Provider>;
}
