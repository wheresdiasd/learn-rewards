import { useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

const API_BASE = 'http://localhost:3001/api';
const peraWallet = new PeraWalletConnect();

interface Reward {
  amount: number;
  txId: string;
  createdAt: string;
  sender?: string;
  round?: number;
  fromContract?: boolean;
}

function Rewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    // Try to reconnect to existing session
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) {
          const address = accounts[0];
          setWalletAddress(address);
          fetchRewards(address);
        } else {
          setLoading(false);
          setError('Please connect your wallet first');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Please connect your wallet first');
      });
  }, []);

  const fetchRewards = async (address: string) => {
    try {
      const res = await fetch(`${API_BASE}/rewards?address=${encodeURIComponent(address)}`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to load rewards');
      }
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
      setError('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setError('');
      setLoading(true);
      const accounts = await peraWallet.connect();
      const address = accounts[0];
      setWalletAddress(address);
      await fetchRewards(address);
    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`);
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
      <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: '#64748b' }}>
        Track your earned LEARN tokens from the blockchain.
      </p>

      {!walletAddress && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2>Connect Your Wallet</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1.05rem' }}>
            Please connect your Pera Wallet to view your rewards
          </p>
          <button onClick={connectWallet}>Connect Pera Wallet</button>
        </div>
      )}

      {error && walletAddress && <div className="error">{error}</div>}

      {walletAddress && (
        <>
          <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', border: '2px solid #e0e7ff' }}>
            <h2>Total Earned</h2>
            <p style={{ fontSize: '3rem', color: '#3b82f6', fontWeight: 'bold', margin: '1.5rem 0', textShadow: '0 2px 4px rgba(59, 130, 246, 0.1)' }}>
              {totalRewards} <span style={{ fontSize: '1.5rem', color: '#8b5cf6' }}>LEARN</span>
            </p>
            <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>
              {rewards.length} transaction{rewards.length !== 1 ? 's' : ''} from blockchain
            </p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.7)', borderRadius: '6px', display: 'inline-block' }}>
              {walletAddress.slice(0, 12)}...{walletAddress.slice(-12)}
            </p>
          </div>

          <div className="card">
        <h2>Transaction History</h2>
        {loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading...</p>
        ) : rewards.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No rewards earned yet. Complete assignments to earn ASA tokens!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e7ff', background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#3b82f6', fontWeight: '600' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#3b82f6', fontWeight: '600' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#3b82f6', fontWeight: '600' }}>Source</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#3b82f6', fontWeight: '600' }}>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#059669' }}>
                      +{reward.amount} LEARN
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{formatDate(reward.createdAt)}</td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {reward.fromContract ? (
                        <span style={{ color: '#8b5cf6', padding: '0.25rem 0.5rem', background: '#f5f3ff', borderRadius: '4px', fontWeight: '500' }}>
                          🤖 Smart Contract
                        </span>
                      ) : (
                        <span>Direct Transfer</span>
                      )}
                      {reward.round && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                          Round {reward.round}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      <a
                        href={`https://testnet.algoexplorer.io/tx/${reward.txId}`}
                        target="_blank"
                        rel="noopener noreferrer"
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
        </>
      )}
    </div>
  );
}

export default Rewards;
