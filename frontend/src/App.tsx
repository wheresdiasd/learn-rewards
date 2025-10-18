import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Volunteer from './pages/Volunteer';
import Rewards from './pages/Rewards';
import Partners from './pages/Partners';
import PurchaseSuccess from './pages/PurchaseSuccess';
import algorandLogo from './assets/algorand-logo.svg';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1 className="logo">
                <img src={algorandLogo} alt="Algorand" className="logo-image" />
                <span style={{ letterSpacing: '-0.02em' }}>
                  <span style={{ color: '#ffffff', fontWeight: '700' }}>L</span><span style={{ color: '#93c5fd', fontWeight: '700' }}>[earn]</span>
                </span>
              </h1>
            </Link>
            <div className="nav-links">
              <Link to="/">Course</Link>
              <Link to="/volunteer">Volunteer</Link>
              <Link to="/rewards">Rewards</Link>
              <Link to="/partners">Partners</Link>
            </div>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/partners/:id/success" element={<PurchaseSuccess />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
