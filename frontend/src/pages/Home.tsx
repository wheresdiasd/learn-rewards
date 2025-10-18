import { useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

const API_BASE = 'http://localhost:3001/api';
const peraWallet = new PeraWalletConnect();

interface Submission {
  prUrl: string;
  status: 'draft' | 'approved' | 'rejected';
  txId?: string;
}

function Home() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [prUrl, setPrUrl] = useState<string>('');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
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

    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`${API_BASE}/submission`);
      if (res.ok) {
        const data = await res.json();
        setSubmission(data);
        setPrUrl(data.prUrl || '');
      }
    } catch (err) {
      console.error('Failed to fetch submission:', err);
    }
  };

  const connectWallet = async () => {
    try {
      setError('');
      const accounts = await peraWallet.connect();
      const address = accounts[0];
      setWalletAddress(address);
      await saveWallet(address);
      setSuccess('Wallet connected successfully!');
    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`);
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

  const submitPR = async () => {
    if (!prUrl.trim()) {
      setError('Please enter a PR URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmission(data);
        setSuccess('PR submission saved!');
      } else {
        setError('Failed to save submission');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    peraWallet.disconnect();
    setWalletAddress('');
    setSuccess('Wallet disconnected');
  };

  return (
    <div>
      <h1>Introduction to Blockchain Development</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#ccc' }}>
        Learn blockchain fundamentals and earn Algorand ASA tokens for completing assignments.
      </p>

      <div className="card">
        <h2>Course Content</h2>
        <div style={{ textAlign: 'left', marginTop: '1rem' }}>
          <h3 style={{ color: '#00d4aa' }}>Module 1: Algorand Basics</h3>
          <h4>Lecture 1: Introduction to Algorand</h4>
          <p style={{ color: '#ccc', lineHeight: '1.6' }}>
            Algorand is a pure proof-of-stake blockchain that provides a decentralized, scalable, and secure platform
            for building applications. In this lecture, you'll learn about Algorand's architecture, consensus mechanism,
            and key features like Algorand Standard Assets (ASAs).
          </p>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#2a2a2a', borderRadius: '4px' }}>
            <strong>Assignment:</strong>
            <p style={{ marginTop: '0.5rem', color: '#ccc' }}>
              Create a simple smart contract on Algorand TestNet and submit a pull request to our demo repository.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Wallet Connection</h2>
        {!walletAddress ? (
          <button onClick={connectWallet}>Connect Pera Wallet</button>
        ) : (
          <div>
            <p style={{ wordBreak: 'break-all', color: '#00d4aa' }}>
              <strong>Connected:</strong> {walletAddress}
            </p>
            <button onClick={disconnectWallet} style={{ marginTop: '1rem', background: '#666' }}>
              Disconnect
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Submit Your Assignment</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="prUrl" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Pull Request URL:
          </label>
          <input
            id="prUrl"
            type="url"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            placeholder="https://github.com/..."
            disabled={loading}
          />
        </div>

        <button onClick={submitPR} disabled={loading || !walletAddress}>
          {loading ? 'Saving...' : 'Submit PR'}
        </button>

        {submission && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#2a2a2a', borderRadius: '4px' }}>
            <p>
              <strong>Status:</strong>{' '}
              <span
                style={{
                  color:
                    submission.status === 'approved'
                      ? '#00d4aa'
                      : submission.status === 'rejected'
                      ? '#ff6b6b'
                      : '#feca57',
                }}
              >
                {submission.status.toUpperCase()}
              </span>
            </p>
            {submission.txId && (
              <p style={{ wordBreak: 'break-all', marginTop: '0.5rem' }}>
                <strong>Transaction ID:</strong> {submission.txId}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
