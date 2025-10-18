import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

interface Reward {
  amount: number;
  txId: string;
  createdAt: string;
}

function Rewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const res = await fetch(`${API_BASE}/rewards`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      } else {
        setError('Failed to load rewards');
      }
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
      setError('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const totalRewards = rewards.reduce((sum, reward) => sum + reward.amount, 0);

  return (
    <div>
      <h1>Your Rewards</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#ccc' }}>
        Track your earned ASA tokens from completed assignments.
      </p>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <h2>Total Earned</h2>
        <p style={{ fontSize: '2rem', color: '#00d4aa', fontWeight: 'bold', margin: '1rem 0' }}>
          {totalRewards} ASA
        </p>
      </div>

      <div className="card">
        <h2>Transaction History</h2>
        {loading ? (
          <p style={{ color: '#888' }}>Loading...</p>
        ) : rewards.length === 0 ? (
          <p style={{ color: '#888' }}>No rewards earned yet. Complete assignments to earn ASA tokens!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#00d4aa' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#00d4aa' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#00d4aa' }}>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#00d4aa' }}>
                      +{reward.amount} ASA
                    </td>
                    <td style={{ padding: '1rem', color: '#ccc' }}>{formatDate(reward.createdAt)}</td>
                    <td
                      style={{
                        padding: '1rem',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all',
                        color: '#ccc',
                      }}
                    >
                      <a
                        href={`https://testnet.algoexplorer.io/tx/${reward.txId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#00d4aa' }}
                      >
                        {reward.txId}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rewards;
