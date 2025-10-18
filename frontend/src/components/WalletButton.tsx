import { useState } from 'react';

interface WalletButtonProps {
  walletAddress: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenModal: () => void;
}

function WalletButton({ walletAddress, onConnect, onDisconnect, onOpenModal }: WalletButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!walletAddress) {
    return (
      <button className="wallet-button" onClick={onOpenModal}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="wallet-dropdown">
      <button
        className="wallet-button connected"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="wallet-indicator"></div>
        <span>{formatAddress(walletAddress)}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {showDropdown && (
        <div className="wallet-dropdown-menu">
          <div className="wallet-address">
            <span className="wallet-address-label">Connected Address</span>
            <span className="wallet-address-full">{walletAddress}</span>
          </div>
          <button className="disconnect-button" onClick={() => {
            onDisconnect();
            setShowDropdown(false);
          }}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export default WalletButton;
