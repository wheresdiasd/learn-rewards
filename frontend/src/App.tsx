import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Volunteer from './pages/Volunteer';
import Rewards from './pages/Rewards';
import Partners from './pages/Partners';
import PurchaseSuccess from './pages/PurchaseSuccess';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="logo">Learn & Earn</h1>
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
