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
      <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: '#64748b' }}>
        Learn blockchain fundamentals and earn Algorand ASA tokens for completing assignments.
      </p>

      <div className="card">
        <h2>Course Content</h2>
        <div style={{ textAlign: 'left', marginTop: '1.5rem' }}>
          <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>Module 1: Algorand Basics</h3>
          <h4 style={{ marginBottom: '0.75rem' }}>Lecture 1: Introduction to Algorand</h4>
          <p style={{ color: '#64748b', lineHeight: '1.7', marginBottom: '1.5rem' }}>
            Algorand is a pure proof-of-stake blockchain that provides a decentralized, scalable, and secure platform
            for building applications. In this lecture, you'll learn about Algorand's architecture, consensus mechanism,
            and key features like Algorand Standard Assets (ASAs).
          </p>
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
            borderRadius: '8px',
            border: '1px solid #e0e7ff'
          }}>
            <strong style={{ color: '#1e293b', fontSize: '1.05rem' }}>Assignment:</strong>
            <p style={{ marginTop: '0.75rem', color: '#475569', lineHeight: '1.6' }}>
              Create a simple smart contract on Algorand TestNet and submit a pull request to our demo repository.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Wallet Connection</h2>
        {!walletAddress ? (
          <div>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Connect your Pera Wallet to submit assignments and receive rewards.
            </p>
            <button onClick={connectWallet}>Connect Pera Wallet</button>
          </div>
        ) : (
          <div>
            <p style={{ wordBreak: 'break-all', color: '#059669', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <strong>Connected:</strong> {walletAddress}
            </p>
            <button onClick={disconnectWallet} style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' }}>
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
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: submission.status === 'approved'
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              : submission.status === 'rejected'
              ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
              : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderRadius: '8px',
            border: `1px solid ${
              submission.status === 'approved'
                ? '#bbf7d0'
                : submission.status === 'rejected'
                ? '#fecaca'
                : '#fde68a'
            }`
          }}>
            <p>
              <strong>Status:</strong>{' '}
              <span
                style={{
                  color:
                    submission.status === 'approved'
                      ? '#059669'
                      : submission.status === 'rejected'
                      ? '#dc2626'
                      : '#d97706',
                  fontWeight: '600'
                }}
              >
                {submission.status.toUpperCase()}
              </span>
            </p>
            {submission.txId && (
              <p style={{ wordBreak: 'break-all', marginTop: '0.75rem', color: '#475569' }}>
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
