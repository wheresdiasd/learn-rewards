import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { PeraWalletConnect } from '@perawallet/connect';
import Home from './pages/Home';
import Volunteer from './pages/Volunteer';
import Rewards from './pages/Rewards';
import Partners from './pages/Partners';
import PurchaseSuccess from './pages/PurchaseSuccess';
import Landing from './pages/Landing';
import WalletButton from './components/WalletButton';
import WalletConnectModal from './components/WalletConnectModal';
import algorandLogo from './assets/algorand-logo.svg';
import './App.css';

const API_BASE = 'http://localhost:3001/api';
const peraWallet = new PeraWalletConnect();

function App() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get organization wallet address from environment variable
  const orgWalletAddress = import.meta.env.VITE_ORG_WALLET_ADDRESS || '';

  useEffect(() => {
    // Reconnect wallet session
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) {
          setWalletAddress(accounts[0]);
          saveWallet(accounts[0]);
        }
      })
      .catch(() => {
        // No previous session
      });
  }, []);

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      const address = accounts[0];
      setWalletAddress(address);
      await saveWallet(address);
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
    }
  };

  const saveWallet = async (address: string) => {
    try {
      await fetch(`${API_BASE}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
    } catch (err) {
      console.error('Failed to save wallet:', err);
    }
  };

  const disconnectWallet = () => {
    peraWallet.disconnect();
    setWalletAddress('');
  };

  // Check if connected wallet is the organization wallet
  const isOrgWallet = walletAddress && orgWalletAddress && walletAddress === orgWalletAddress;

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to={isOrgWallet ? "/volunteer" : "/"} style={{ textDecoration: 'none' }}>
              <h1 className="logo">
                <img src={algorandLogo} alt="Algorand" className="logo-image" />
                <span style={{ letterSpacing: '-0.02em' }}>
                  <span style={{ color: '#ffffff', fontWeight: '700' }}>L</span><span style={{ color: '#93c5fd', fontWeight: '700' }}>[earn]</span>
                </span>
              </h1>
            </Link>
            <div className="nav-links">
              {/* Show Course link only for non-organization wallets */}
              {!isOrgWallet && <Link to="/">Course</Link>}
              {/* Show Volunteer link only for organization wallet */}
              {isOrgWallet && <Link to="/volunteer">Volunteer</Link>}
              <Link to="/rewards">Rewards</Link>
              <Link to="/partners">Partners</Link>
              <WalletButton
                walletAddress={walletAddress}
                onConnect={connectWallet}
                onDisconnect={disconnectWallet}
                onOpenModal={() => setIsModalOpen(true)}
              />
            </div>
          </div>
        </nav>
        <WalletConnectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConnect={connectWallet}
        />
        <main className="main-content">
          <Routes>
            {/* Home route - different content based on wallet type */}
            <Route
              path="/"
              element={
                !walletAddress ? (
                  // Not logged in - show landing page
                  <Landing onOpenModal={() => setIsModalOpen(true)} />
                ) : isOrgWallet ? (
                  // Organization wallet - show volunteer review panel
                  <Volunteer />
                ) : (
                  // Regular user - show course page
                  <Home walletAddress={walletAddress} />
                )
              }
            />
            {/* Volunteer route - only accessible for organization wallet */}
            <Route
              path="/volunteer"
              element={
                isOrgWallet ? (
                  <Volunteer />
                ) : (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <h2>Access Restricted</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '1rem' }}>
                      Only the organization wallet can access the Volunteer panel.
                    </p>
                  </div>
                )
              }
            />
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
