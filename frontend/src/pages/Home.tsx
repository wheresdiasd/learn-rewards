import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

interface Submission {
  prUrl: string;
  status: 'draft' | 'approved' | 'rejected';
  txId?: string;
}

interface HomeProps {
  walletAddress: string;
}

function Home({ walletAddress }: HomeProps) {
  const [prUrl, setPrUrl] = useState<string>('');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'course' | 'assignment'>('course');

  useEffect(() => {
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

  return (
    <div>
      <h1>Introduction to Blockchain Development</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: '#64748b' }}>
        Learn blockchain fundamentals and earn Algorand ASA tokens for completing assignments.
      </p>

      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'course' ? 'active' : ''}`}
            onClick={() => setActiveTab('course')}
          >
            Course Content
          </button>
          <button
            className={`tab ${activeTab === 'assignment' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignment')}
          >
            Assignment
          </button>
        </div>

        {activeTab === 'course' && (
          <div className="tab-content">
            <h2 style={{ marginBottom: '1rem' }}>Module 1: Algorand Basics</h2>
            <h3 style={{ color: '#3b82f6', marginBottom: '1.5rem', fontWeight: '500' }}>Lecture 1: Introduction to Algorand</h3>

            <div className="video-container">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/eG_b2m6_Aa8"
                title="Introduction to Algorand"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: '#1e293b', marginBottom: '0.75rem' }}>What you'll learn:</h4>
              <ul style={{ color: '#64748b', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li>Algorand's pure proof-of-stake consensus mechanism</li>
                <li>Blockchain architecture and key features</li>
                <li>Algorand Standard Assets (ASAs) and their use cases</li>
                <li>Building decentralized applications on Algorand</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'assignment' && (
          <div className="tab-content">
            <h2 style={{ marginBottom: '1rem' }}>Assignment: Your First Smart Contract</h2>

            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
              borderRadius: '12px',
              border: '1px solid #e0e7ff',
              marginBottom: '2rem'
            }}>
              <h3 style={{ color: '#1e293b', marginBottom: '1rem', fontSize: '1.1rem' }}>Task</h3>
              <p style={{ color: '#475569', lineHeight: '1.7', marginBottom: '1rem' }}>
                Create a simple smart contract on Algorand TestNet and submit a pull request to our demo repository.
              </p>
              <h4 style={{ color: '#1e293b', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Requirements:</h4>
              <ul style={{ color: '#64748b', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li>Use PyTeal or Beaker framework</li>
                <li>Deploy to Algorand TestNet</li>
                <li>Include tests for your contract</li>
                <li>Document your code with comments</li>
              </ul>
            </div>

            <h2 style={{ marginBottom: '1rem' }}>Submit Your Assignment</h2>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            {!walletAddress && (
              <div style={{
                padding: '1rem',
                background: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '8px',
                border: '1px solid #fde68a',
                marginBottom: '1.5rem',
                color: '#92400e'
              }}>
                Please connect your wallet to submit the assignment.
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="prUrl" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
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
        )}
      </div>
    </div>
  );
}

export default Home;
