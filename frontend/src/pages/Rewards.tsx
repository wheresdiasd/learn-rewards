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
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#ccc' }}>
        Track your earned LEARN tokens from the blockchain.
      </p>

      {!walletAddress && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Connect Your Wallet</h2>
          <p style={{ color: '#888', marginBottom: '1.5rem' }}>
            Please connect your Pera Wallet to view your rewards
          </p>
          <button onClick={connectWallet}>Connect Pera Wallet</button>
        </div>
      )}

      {error && walletAddress && <div className="error">{error}</div>}

      {walletAddress && (
        <>
          <div className="card">
            <h2>Total Earned (LEARN Tokens)</h2>
            <p style={{ fontSize: '2rem', color: '#00d4aa', fontWeight: 'bold', margin: '1rem 0' }}>
              {totalRewards} LEARN
            </p>
            <p style={{ fontSize: '0.9rem', color: '#888' }}>
              {rewards.length} transaction{rewards.length !== 1 ? 's' : ''} from blockchain
            </p>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
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
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#00d4aa' }}>Source</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#00d4aa' }}>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#00d4aa' }}>
                      +{reward.amount} LEARN
                    </td>
                    <td style={{ padding: '1rem', color: '#ccc' }}>{formatDate(reward.createdAt)}</td>
                    <td style={{ padding: '1rem', color: '#ccc', fontSize: '0.85rem' }}>
                      {reward.fromContract ? (
                        <span style={{ color: '#ffa500' }}>
                          🤖 Smart Contract
                        </span>
                      ) : (
                        <span>Direct Transfer</span>
                      )}
                      {reward.round && (
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                          Round {reward.round}
                        </div>
                      )}
                    </td>
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
        </>
      )}
    </div>
  );
}

export default Rewards;
