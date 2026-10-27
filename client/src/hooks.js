import { useEffect, useState, useCallback } from 'react';
// Runs an async loader and tracks loading/error state.
export function useAsync(fn, deps) {
  const [s, set] = useState({ data: null, loading: true, error: null });
  const run = useCallback(() => {
    set(p => ({ ...p, loading: true, error: null }));
    fn().then(data => set({ data, loading: false, error: null })).catch(e => set({ data: null, loading: false, error: e.message }));
  }, deps); // eslint-disable-line
  useEffect(run, [run]);
  return { ...s, reload: run };
}

// Finds a wide banner image: database link first, then /backdrops/<id>.jpg for local titles. Returns null if none loads.
export function useBackdrop(movie) {
  const [url, setUrl] = useState(movie?.backdropUrl || null);
  useEffect(() => {
    if (!movie) return;
    if (movie.backdropUrl) return setUrl(movie.backdropUrl);
    setUrl(null);
    if (movie.source !== 'local') return;
    const file = `/backdrops/${movie.id}.jpg`, img = new Image();
    img.onload = () => setUrl(file);
    img.src = file;
  }, [movie?.id, movie?.backdropUrl]);
  return url;
}

// Optional transparent character PNG at /cutouts/<id>.png (local titles only). Returns null if the file doesn't exist.
export function useCutout(movie) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    setUrl(null);
    if (!movie || movie.source !== 'local') return;
    const file = `/cutouts/${movie.id}.png`, img = new Image();
    img.onload = () => setUrl(file);
    img.src = file;
  }, [movie?.id]);
  return url;
}
