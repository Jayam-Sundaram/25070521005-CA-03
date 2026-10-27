import { useEffect, useState } from 'react';
// Film-leader countdown shown once per browser session. Click to skip.
export default function Intro() {
  const [step, setStep] = useState(() => {
    try { return sessionStorage.getItem('cv-intro') || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? null : 3; } catch { return null; }
  });
  useEffect(() => {
    if (step === null) return;
    const t = setTimeout(() => {
      if (step > 0) setStep(step - 1);
      else { try { sessionStorage.setItem('cv-intro', '1'); } catch { /* ignore */ } setStep(null); }
    }, step > 0 ? 700 : 500);
    return () => clearTimeout(t);
  }, [step]);
  if (step === null) return null;
  const skip = () => { try { sessionStorage.setItem('cv-intro', '1'); } catch { /* ignore */ } setStep(null); };
  return <div className={`intro ${step === 0 ? 'out' : ''}`} onClick={skip} role="presentation">
    <div className="reel"><i /><span key={step}>{step || ''}</span></div>
    <p className="intro-logo">CINEVERSE</p><small>Click to skip</small>
  </div>;
}
