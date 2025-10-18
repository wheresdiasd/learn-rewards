# Algorand Learning Platform - 2-Day Hackathon MVP

A non-profit learning platform MVP that rewards learners with Algorand ASA tokens on TestNet for completing course assignments.

## Features

- **Single Course/Module/Lecture**: Introduction to Blockchain Development
- **Wallet Integration**: Connect with Pera Wallet
- **PR Submission**: Submit pull request URLs for review
- **Volunteer Review**: Simple Pass/Fail review system
- **ASA Rewards**: Real Algorand ASA transfers on TestNet when submissions are approved
- **Partner Directory**: 6 mock educational partners (simulated purchases)
- **No Authentication**: Single default learner, no login required

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Blockchain**: Algorand TestNet (algosdk + Pera Wallet Connect)
- **Persistence**: JSON file (data.json)

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

## How to Create an ASA on TestNet (Optional Script)

If you need to create an ASA quickly, here's a simple script:

```bash
cd backend
node create-asa.js
```

Create `backend/create-asa.js`:

```javascript
import algosdk from 'algosdk';

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
const mnemonic = 'YOUR 25 WORD MNEMONIC HERE';
const account = algosdk.mnemonicToSecretKey(mnemonic);

async function createASA() {
  const suggestedParams = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: account.addr,
    total: 1000000,
    decimals: 0,
    assetName: 'LearnToken',
    unitName: 'LEARN',
    assetURL: 'https://example.com',
    defaultFrozen: false,
    manager: account.addr,
    reserve: account.addr,
    freeze: account.addr,
    clawback: account.addr,
    suggestedParams,
  });

  const signedTxn = txn.signTxn(account.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  const result = await algosdk.waitForConfirmation(algodClient, txId, 4);

  const assetIndex = result['asset-index'];
  console.log(`ASA created! Asset ID: ${assetIndex}`);
  console.log(`Add this to your .env file: ASA_ID=${assetIndex}`);
}

createASA().catch(console.error);
```

## Demo Flow (Acceptance Criteria)

### 1. Home Page - Connect Wallet & Submit PR

1. Navigate to http://localhost:5173
2. Click "Connect Pera Wallet"
3. Approve connection in Pera Wallet app
4. Enter a PR URL (e.g., `https://github.com/user/repo/pull/123`)
5. Click "Submit PR"
6. See status update to "DRAFT"

### 2. Volunteer Page - Review & Approve

1. Navigate to `/volunteer`
2. See the submitted PR URL and wallet address
3. Click "Pass & Send ASA"
4. Backend sends 100 ASA to the learner's wallet
5. Transaction ID displayed on success

### 3. Rewards Page - View Transaction History

1. Navigate to `/rewards`
2. See the reward entry with amount and transaction ID
3. Click the transaction ID to view on AlgoExplorer TestNet

### 4. Partners Page - Simulated Purchase

1. Navigate to `/partners`
2. Browse 6 mock partner organizations
3. Click "Buy with ASA" on any partner
4. Redirected to success page with fake order ID
5. No actual payment processed (pure simulation)

## Project Structure

```
algorand/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Course + wallet + PR submission
│   │   │   ├── Volunteer.tsx     # Review panel
│   │   │   ├── Rewards.tsx       # Transaction history
│   │   │   ├── Partners.tsx      # Partner directory
│   │   │   └── PurchaseSuccess.tsx
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
├── backend/
│   ├── server.js                 # Express API + Algorand logic
│   ├── data.json                 # JSON file persistence (created on first run)
│   ├── .env.example
│   └── package.json
├── package.json                  # Root workspace config
└── README.md
```

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

This is a **demo-only MVP** with no security features:
- No authentication/authorization
- No rate limiting
- No input validation
- Custodial wallet (server holds mnemonic)
- Single default user

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
