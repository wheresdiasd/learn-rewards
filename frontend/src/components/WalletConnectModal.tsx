import Modal from './Modal';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const handleConnect = () => {
    onConnect();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Your Wallet">
      <div className="wallet-modal-content">
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Connect your Pera Wallet to submit assignments and receive rewards for completing blockchain development courses.
        </p>

        <div className="wallet-option">
          <div className="wallet-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="wallet-info">
            <h3>Pera Wallet</h3>
            <p>Secure and easy-to-use Algorand wallet</p>
          </div>
          <button onClick={handleConnect} className="connect-button">
            Connect
          </button>
        </div>

        <div className="wallet-footer">
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default WalletConnectModal;
