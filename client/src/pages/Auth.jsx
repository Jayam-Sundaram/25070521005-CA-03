import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.jsx';
import { Poster } from '../components/Parts.jsx';

function AuthForm({ mode }) {
  const reg = mode === 'register';
  const { login, notify } = useApp();
  const nav = useNavigate();
  const from = useLocation().state?.from || '/';
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [wall, setWall] = useState([]);
  useEffect(() => { api.movies({}).then(d => setWall(d.results.slice(0, 12))).catch(() => {}); }, []);
  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const { user } = await (reg ? api.register(f) : api.login({ email: f.email, password: f.password })); login(user); notify(reg ? 'Welcome to CineVerse' : `Welcome back, ${user.name}`); nav(from, { replace: true }); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const on = k => e => setF({ ...f, [k]: e.target.value });
  return <div className="auth"><aside className="auth-art"><div className="wall" aria-hidden="true">{[0, 1, 2].map(c => { const col = wall.filter((_, i) => i % 3 === c); return <div key={c} className={`col ${c === 1 ? 'down' : ''}`}>{[...col, ...col].map((m, i) => <Poster key={i} movie={m} />)}</div>; })}</div><span className="kicker">CineVerse</span><h2>Your world of film</h2><p>Track what you watch, rate it out of 10, and see what the community thinks.</p></aside><form onSubmit={submit} noValidate>
    <h1>{reg ? 'Create your account' : 'Log in'}</h1>
    {err && <p className="form-err" role="alert">{err}</p>}
    {reg && <label>Name<input value={f.name} onChange={on('name')} autoComplete="name" required /></label>}
    <label>Email<input type="email" value={f.email} onChange={on('email')} autoComplete="email" required /></label>
    <label>Password<input type="password" value={f.password} onChange={on('password')} autoComplete={reg ? 'new-password' : 'current-password'} required />
      {reg && <small className="muted">At least 8 characters, with a letter and a number.</small>}</label>
    <button className="btn" disabled={busy}>{busy ? 'Please wait' : reg ? 'Register' : 'Log in'}</button>
    <p className="muted">{reg ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
  </form></div>;
}
export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
