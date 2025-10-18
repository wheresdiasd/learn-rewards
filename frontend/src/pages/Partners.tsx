import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

interface Partner {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  asaCost: number;
}

function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await fetch(`${API_BASE}/partners`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      } else {
        setError('Failed to load partners');
      }
    } catch (err) {
      console.error('Failed to fetch partners:', err);
      setError('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (partnerId: number) => {
    try {
      const res = await fetch(`${API_BASE}/partners/${partnerId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        navigate(`/partners/${partnerId}/success`, {
          state: { partner: partners.find((p) => p.id === partnerId), orderId: data.fakeOrderId },
        });
      } else {
        setError('Purchase failed');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError('Purchase failed');
    }
  };

  return (
    <div>
      <h1>Partner Directory</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: '#64748b' }}>
        Use your earned ASA tokens to access learning opportunities from our partner institutions.
      </p>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading partners...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem',
          }}
        >
          {partners.map((partner) => (
            <div key={partner.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <img
                src={partner.imageUrl}
                alt={partner.name}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #e0e7ff',
                }}
              />
              <h3 style={{ marginBottom: '0.75rem', color: '#1e293b' }}>{partner.name}</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.7', flex: 1 }}>{partner.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #e0e7ff' }}>
                <span style={{ fontWeight: 'bold', color: '#8b5cf6', fontSize: '1.25rem' }}>
                  {partner.asaCost} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>ASA</span>
                </span>
                <button onClick={() => handlePurchase(partner.id)} style={{ fontSize: '0.95rem' }}>Buy with ASA</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Partners;
