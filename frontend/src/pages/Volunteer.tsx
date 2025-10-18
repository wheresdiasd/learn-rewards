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
      <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: '#64748b' }}>
        Review learner submissions and approve rewards.
      </p>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {!submission || !submission.prUrl ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>No submission available yet.</p>
        </div>
      ) : (
        <div className="card">
          <h2>Current Submission</h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              <strong>Pull Request URL:</strong>
            </label>
            <a
              href={submission.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ wordBreak: 'break-all' }}
            >
              {submission.prUrl}
            </a>
          </div>

          {submission.walletAddress && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                <strong>Learner Wallet:</strong>
              </label>
              <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#64748b', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                {submission.walletAddress}
              </p>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              <strong>Status:</strong>
            </label>
            <span
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: '600',
                background:
                  submission.status === 'approved'
                    ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                    : submission.status === 'rejected'
                    ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                    : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                color:
                  submission.status === 'approved'
                    ? '#059669'
                    : submission.status === 'rejected'
                    ? '#dc2626'
                    : '#d97706',
              }}
            >
              {submission.status.toUpperCase()}
            </span>
          </div>

          {submission.txId && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                <strong>Transaction ID:</strong>
              </label>
              <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#64748b', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
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
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff' }}
              >
                Fail
              </button>
            </div>
          )}

          {!submission.walletAddress && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <p style={{ color: '#dc2626', margin: 0 }}>
                ⚠ Learner must connect wallet before approval.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Volunteer;
