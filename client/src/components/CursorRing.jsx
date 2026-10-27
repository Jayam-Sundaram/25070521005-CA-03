import { useEffect, useRef, useState } from 'react';
// A lime ring that glides after the mouse, grows over clickable things and says VIEW over movie cards. Mouse devices only.
export default function CursorRing() {
  const ref = useRef(null);
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = ref.current;
    let x = 0, y = 0, tx = 0, ty = 0, raf;
    const move = e => {
      tx = e.clientX; ty = e.clientY;
      el.classList.add('show');
      el.classList.toggle('hot', Boolean(e.target.closest?.('.card-link,.btn,.chip,.mood,.play,.tabbar button,.icon-btn,a,button')));
      setLabel(e.target.closest?.('.card-link') ? 'VIEW' : '');
    };
    const leave = () => el.classList.remove('show');
    const loop = () => { x += (tx - x) * 0.2; y += (ty - y) * 0.2; el.style.transform = `translate(${x}px,${y}px)`; raf = requestAnimationFrame(loop); };
    window.addEventListener('mousemove', move); document.addEventListener('mouseleave', leave); raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', move); document.removeEventListener('mouseleave', leave); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="cursor" aria-hidden="true"><span>{label}</span></div>;
}
