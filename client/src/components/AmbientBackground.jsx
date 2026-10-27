import { useEffect } from 'react';
// Site-wide living background: a soft light follows the cursor and its colour drifts from red (left) to lime (right).
export default function AmbientBackground() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    let raf;
    const move = e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth, y = e.clientY / window.innerHeight;
        root.style.setProperty('--cx', `${(x * 100).toFixed(1)}%`);
        root.style.setProperty('--cy', `${(y * 100).toFixed(1)}%`);
        root.style.setProperty('--ah', String(Math.round((350 + x * 85) % 360)));
      });
    };
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);
  return <><div className="ambient" aria-hidden="true" /><div className="grain" aria-hidden="true" /></>;
}
