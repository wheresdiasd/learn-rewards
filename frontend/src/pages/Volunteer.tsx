import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

interface Submission {
  prUrl: string;
  walletAddress?: string;
  status: 'draft' | 'approved' | 'rejected';
  txId?: string;
}

function Volunteer() {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`${API_BASE}/submission`);
      if (res.ok) {
        const data = await res.json();
        setSubmission(data);
      }
    } catch (err) {
      console.error('Failed to fetch submission:', err);
      setError('Failed to load submission');
    }
  };

  const handlePass = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/review/pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setSubmission(data);
        setSuccess(`✓ Approved! ASA transferred. TX: ${data.txId}`);
      } else {
        const errorData = await res.json();
        setError(`Failed to approve: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFail = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/review/fail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setSubmission(data);
        setSuccess('Submission marked as rejected');
      } else {
        setError('Failed to reject submission');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Volunteer Review Panel</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#ccc' }}>
        Review learner submissions and approve rewards.
      </p>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {!submission || !submission.prUrl ? (
        <div className="card">
          <p style={{ color: '#888' }}>No submission available yet.</p>
        </div>
      ) : (
        <div className="card">
          <h2>Current Submission</h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00d4aa' }}>
              <strong>Pull Request URL:</strong>
            </label>
            <a
              href={submission.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00d4aa', wordBreak: 'break-all' }}
            >
              {submission.prUrl}
            </a>
          </div>

          {submission.walletAddress && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00d4aa' }}>
                <strong>Learner Wallet:</strong>
              </label>
              <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#ccc' }}>
                {submission.walletAddress}
              </p>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00d4aa' }}>
              <strong>Status:</strong>
            </label>
            <p
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
            </p>
          </div>

          {submission.txId && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00d4aa' }}>
                <strong>Transaction ID:</strong>
              </label>
              <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#ccc' }}>
                {submission.txId}
              </p>
            </div>
          )}

          {submission.status === 'draft' && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={handlePass} disabled={loading || !submission.walletAddress}>
                {loading ? 'Processing...' : 'Pass & Send ASA'}
              </button>
              <button
                onClick={handleFail}
                disabled={loading}
                style={{ background: '#ff6b6b', color: '#fff' }}
              >
                Fail
              </button>
            </div>
          )}

          {!submission.walletAddress && (
            <p style={{ color: '#ff6b6b', marginTop: '1rem' }}>
              ⚠ Learner must connect wallet before approval.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Volunteer;
