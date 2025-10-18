# Quick Start Guide

This guide will get you up and running in 10 minutes.

## Step 1: Install Dependencies (2 min)

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

## Step 2: Create TestNet Wallet & ASA (5 min)

### Option A: Use Pera Wallet Mobile App

1. Download Pera Wallet from [App Store](https://apps.apple.com/app/algorand-wallet/id1459898525) or [Google Play](https://play.google.com/store/apps/details?id=com.algorand.android)
2. Create a new wallet
3. **IMPORTANT**: Write down your 25-word recovery phrase securely
4. Switch to TestNet mode in app settings
5. Get TestNet ALGO from [Algorand Dispenser](https://bank.testnet.algorand.network/)

### Option B: Use MyAlgo Wallet (Web)

1. Go to [MyAlgo Wallet](https://wallet.myalgo.com)
2. Create a new wallet and save your mnemonic
3. Switch to TestNet
4. Get TestNet ALGO from the dispenser

## Step 3: Create Your ASA (2 min)

```bash
cd backend
node create-asa.js
```

When prompted, paste your 25-word mnemonic. The script will:
- Create a new ASA called "LearnToken" (LEARN)
- Print the Asset ID
- Tell you what to add to your .env file

Example output:
```
✓ Success! ASA created on TestNet

Asset ID: 123456789
Asset Name: LearnToken
Unit Name: LEARN
Total Supply: 1,000,000

Add this to your backend/.env file:
ASA_ID=123456789
```

## Step 4: Configure Backend (.env) (1 min)

```bash
# Copy example env
cp .env.example .env

# Edit .env with your values
nano .env
```

Add your values:
```env
ALGOD_URL=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
ORG_MNEMONIC=your 25 word mnemonic phrase here
ASA_ID=123456789
```

**Save and exit** (Ctrl+X, Y, Enter)

## Step 5: Start the Application (instant)

From the root directory:

```bash
npm run dev
```

You'll see:
```
Backend server running on http://localhost:3001
Frontend running on http://localhost:5173
```

## Step 6: Test the Flow (1 min)

1. Open http://localhost:5173
2. Connect wallet (you may need to scan QR with Pera app)
3. Enter a test PR URL: `https://github.com/algorand/go-algorand/pull/1`
4. Click "Submit PR"
5. Go to http://localhost:5173/volunteer
6. Click "Pass & Send ASA"
7. Wait 5 seconds for blockchain confirmation
8. See transaction ID appear!
9. Go to Rewards page to see your first reward

## Troubleshooting

### "Insufficient balance" error
- Your organization wallet needs at least 0.1 ALGO for transaction fees
- Get more from https://bank.testnet.algorand.network/

### "Transaction failed: asset not found"
- The learner wallet needs to opt-in to receive the ASA
- In Pera Wallet, go to Add Asset → enter ASA ID → Add

### Wallet won't connect
- Ensure Pera Wallet app is open
- Try closing and reopening the connection modal
- Check your device and computer are on the same network

### Backend won't start
- Check Node.js version: `node --version` (should be 18+)
- Verify .env file exists in backend directory
- Check .env has all required values

## What's Next?

- Read [README.md](./README.md) for full documentation
- Check [DEMO.md](./DEMO.md) for the complete demo script
- Explore the code in `frontend/src/` and `backend/`

## Security Reminder

⚠️ **This is a demo/hackathon MVP**
- Only use TestNet
- Never use mainnet mnemonics
- Don't deploy to production as-is
- No security features included

---

**You're ready to demo!** 🎉
