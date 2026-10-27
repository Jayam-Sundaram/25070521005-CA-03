import { Routes, Route, Link } from 'react-router-dom';
import { Navbar, Footer, Empty } from './components/Parts.jsx';
import Guard from './components/Guard.jsx';
import Home from './pages/Home.jsx';
import Discover from './pages/Discover.jsx';
import MovieDetails from './pages/MovieDetails.jsx';
import { Login, Register } from './pages/Auth.jsx';
import Watchlist from './pages/Watchlist.jsx';
import Admin from './pages/Admin.jsx';
import AmbientBackground from './components/AmbientBackground.jsx';
import Intro from './components/Intro.jsx';
import CursorRing from './components/CursorRing.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

export default function App() {
  return <>
    <Intro />
    <CursorRing />
    <AmbientBackground />
    <Navbar />
    <main>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/watchlist" element={<Guard><Watchlist /></Guard>} />
        <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
        <Route path="*" element={<Empty title="Page not found" hint="That address doesn’t exist."><Link className="btn" to="/">Back to home</Link></Empty>} />
      </Routes>
      </ErrorBoundary>
    </main>
    <Footer />
  </>;
}
