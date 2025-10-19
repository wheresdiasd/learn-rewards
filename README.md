DEMO VIDEO - https://www.youtube.com/watch?v=JtcKaPuDYfc


# Algorand Learning Platform - 2-Day Hackathon MVP

A non-profit learning platform MVP that rewards learners with Algorand ASA tokens on TestNet for completing course assignments.

## Features

- **Single Course/Module/Lecture**: Introduction to Blockchain Development
- **Wallet Authentication**: Connect with Pera Wallet for blockchain-based identity
- **PR Submission**: Submit pull request URLs for review
- **Volunteer Review**: Simple Pass/Fail review system
- **ASA Rewards**: Real Algorand ASA transfers on TestNet when submissions are approved
- **Partner Directory**: 6 mock educational partners (simulated purchases)
- **Decentralized Auth**: Wallet address as identity, no traditional login required

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Blockchain**: Algorand TestNet (algosdk + Pera Wallet Connect)
- **Smart Contracts**: TEALScript (TypeScript-to-TEAL compiler)
- **Persistence**: JSON file (data.json)

## Smart Contract: RewardContract

The platform uses an Algorand smart contract for decentralized reward distribution. The contract holds ASA tokens in escrow and automatically pays learners when a validator approves their submission.

**Contract Source:** `contracts/RewardContract.algo.ts`

### State Variables

- `validator` - Address authorized to approve submissions
- `asaId` - The ASA token ID to distribute (LearnToken)
- `rewardAmount` - Tokens per approval (100 LEARN)

### Core Methods

**`createApplication(validator, asaId, rewardAmount)`**
- Initializes contract with validator address and reward parameters
- Called once during deployment

**`optInToAsa()`**
- Opts the contract into the ASA (required before receiving tokens)
- Algorand accounts must explicitly opt-in to any ASA

**`approveAndPay(learner)`**
- Validates caller is the authorized validator
- Automatically transfers `rewardAmount` ASA to learner
- Uses **inner transactions** for atomic payment
- Either succeeds completely or reverts (no partial states)

**`getBalance()`**
- Read-only method to check contract's ASA balance

**`updateValidator(newValidator)`**
- Allows current validator to change the authorized address

**`updateRewardAmount(newAmount)`**
- Allows validator to adjust reward amount

### How It Works

1. Contract is deployed with validator address, ASA ID, and reward amount
2. Contract opts into the ASA token
3. Organization funds contract with ASA tokens
4. When validator approves a submission, they call `approveAndPay(learnerAddress)`
5. Contract validates sender is the validator
6. Contract sends ASA to learner via inner transaction (atomic, ~4.5 seconds)

### Why Algorand?

- **TEALScript**: Write contracts in TypeScript instead of Solidity
- **Inner Transactions**: Contracts can send assets on behalf of their escrow account
- **Instant Finality**: 4.5 second blocks, 1 confirmation is final
- **Low Cost**: ~$0.0006 per approval (vs. $5-50 on Ethereum)
- **Layer-1 ASA**: Tokens are protocol primitives, not vulnerable smart contracts

See `contracts/README.md` for deployment instructions.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Algorand TestNet Wallet**:
   - Create a wallet on [MyAlgo](https://wallet.myalgo.com) or use Pera Wallet
   - Fund it with TestNet ALGO from the [Algorand Dispenser](https://bank.testnet.algorand.network/)
3. **Create an ASA on TestNet**:
   - Use [Algorand Studio](https://studio.algolabs.net/) or the Algorand SDK
   - Note the Asset ID for your .env file

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm run install:all
```

### 2. Configure Backend Environment

```bash
# Copy the example env file
cd backend
cp .env.example .env
```

Edit `backend/.env` with your TestNet credentials:

```env
ALGOD_URL=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
ORG_MNEMONIC=twelve crucial salon omit fire angry ritual genius cake fetch run tone dose conduct say alien inherit obvious evidence sail hero deer crawl shift
ASA_ID=your_asa_asset_id
```

### 3. Start the Application

From the root directory:

```bash
npm run dev
```

This starts both frontend (port 5173) and backend (port 3001) concurrently.

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## How to Create an ASA on TestNet

The project includes `backend/create-asa.js` for creating the LearnToken ASA on TestNet using BIP-39/BIP-32 HD wallet derivation.

### Usage

```bash
cd backend
MNEMONIC="word1 word2 ... word24" CREATE_ASA=true node create-asa.js
```

### Environment Variables

- **`MNEMONIC`** (required): 24-word BIP-39 mnemonic phrase
- **`CREATE_ASA`** (required): Set to `true` to create the ASA
- **`BIP39_PASS`** (optional): BIP-39 passphrase (default: empty string)
- **`ACCOUNT`** (optional): BIP-32 account number (default: 0)
- **`INDEX`** (optional): BIP-32 address index (default: 0)
- **`TARGET_ADDR`** (optional): Expected address for sanity check

### ASA Configuration

The script creates LearnToken with these parameters (edit in `create-asa.js` lines 21-28):

```javascript
{
  name: "LearnToken",
  unit: "LEARN",
  decimals: 6,
  totalBaseUnits: 1_000_000_000_000n, // 1M tokens with 6 decimals
  defaultFrozen: false,
  url: "https://example.com/learn"
}
```

### How It Works

1. **Derives address** from 24-word mnemonic using BIP-44 path: `m/44'/283'/${ACCOUNT}'/0/${INDEX}`
2. **Validates derivation** against `TARGET_ADDR` if provided
3. **Creates ASA** on TestNet with specified parameters (if `CREATE_ASA=true`)
4. **Signs transaction** using xHD wallet API (compatible with multiple library versions)
5. **Outputs** Asset ID for use in `.env` file

### Example Output

```
✅ Derived address: 5K747I...WCPNAEQ
   Path:           m/44'/283'/0'/0/0
🔐 Sanity check: derived address matches TARGET_ADDR.
🎉 ASA created on TestNet
   TxID:      ABC123...XYZ
   Asset ID:  123456789
   Round:     12345678
```

Add the Asset ID to `backend/.env`:

```env
ASA_ID=123456789
```

### Compatibility Notes

The script includes compatibility shims for different versions of `@algorandfoundation/xhd-wallet-api`:
- Tries both 4-argument and 5-argument `keyGen()` signatures
- Handles both short and long form `signAlgoTransaction()` calls
- See `backend/create-asa.js:33-65` for implementation details

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get default learner info |
| POST | `/api/wallet` | Save wallet address |
| GET | `/api/submission` | Get current submission |
| POST | `/api/submission` | Submit PR URL |
| POST | `/api/review/pass` | Approve submission & send ASA |
| POST | `/api/review/fail` | Reject submission |
| GET | `/api/rewards` | Get reward history |
| GET | `/api/partners` | Get partner list (6 items) |
| POST | `/api/partners/:id/purchase` | Simulate purchase |

## Important Notes

### Security (Intentional Omissions)

This is a **demo-only MVP** with limited security features:
- **Wallet-based authentication**: Uses Pera Wallet connection (blockchain identity)
- **No backend authorization**: Volunteer page has no access control
- **No rate limiting**: Endpoints are unprotected
- **No input validation**: PR URLs and addresses not validated
- **Custodial validator**: Server holds validator mnemonic for approvals
- **Single learner mode**: Simplified for demo purposes

**DO NOT use in production or with mainnet funds!**

### TestNet Only

- All transactions happen on Algorand TestNet
- TestNet ALGO and ASAs have no real value
- Use the [Algorand TestNet Dispenser](https://bank.testnet.algorand.network/) to fund your wallet

### Partner Purchases

The partner "Buy with ASA" functionality is **fully simulated**:
- No actual ASA transfer occurs
- No blockchain interaction
- Just records a fake order ID

## Troubleshooting

### Wallet Connection Issues

- Ensure Pera Wallet app is installed on your mobile device
- Check that you're on the same network for QR code scanning
- Clear browser cache and reconnect

### ASA Transfer Fails

- Verify your .env file has correct `ORG_MNEMONIC` and `ASA_ID`
- Ensure the organization wallet has sufficient TestNet ALGO for transaction fees
- Check that the learner's wallet has opted-in to receive the ASA (or set the ASA to allow automatic opt-in)

### Backend Crashes

- Check that Node.js version is 18+
- Verify all environment variables are set
- Review backend console for error messages

## Next Steps (Post-Hackathon)

This MVP intentionally omits features for a 2-day timebox. Future iterations could add:

- User authentication
- Multiple courses/modules/lectures
- Real role-based access control
- Database (PostgreSQL, MongoDB)
- Rate limiting and input validation
- Real partner payment integration
- Smart contract for trustless reward distribution
- Advanced wallet features (multi-sig, etc.)

## License

MIT (demo purposes only)

## Support

For issues or questions, please open an issue on GitHub.

Example pr
