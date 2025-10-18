import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';

function PurchaseSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { partner, orderId } = (location.state as any) || {};

  useEffect(() => {
    if (!partner) {
      // If no state, redirect to partners page
      navigate('/partners');
    }
  }, [partner, navigate]);

  if (!partner) {
    return null;
  }

  return (
    <div>
      <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
        <h1 style={{ color: '#00d4aa', marginBottom: '1rem' }}>Purchase Successful!</h1>
        <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '2rem' }}>
          You've successfully enrolled in <strong>{partner.name}</strong>
        </p>

        <div style={{ background: '#2a2a2a', padding: '1.5rem', borderRadius: '4px', marginBottom: '2rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Order ID:</strong>
          </p>
          <p style={{ fontFamily: 'monospace', color: '#00d4aa', fontSize: '1.1rem' }}>{orderId}</p>
        </div>

        <div style={{ background: '#2a2a2a', padding: '1.5rem', borderRadius: '4px', marginBottom: '2rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Amount Paid:</strong>
          </p>
          <p style={{ color: '#00d4aa', fontSize: '1.3rem', fontWeight: 'bold' }}>{partner.asaCost} ASA</p>
        </div>

        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Note: This is a simulated purchase for demo purposes. No actual payment was processed.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => navigate('/partners')}>Back to Partners</button>
          <button onClick={() => navigate('/')} style={{ background: '#666' }}>
            Go to Course
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseSuccess;
