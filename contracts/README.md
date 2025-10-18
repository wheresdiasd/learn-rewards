# Smart Contract Migration - Setup Guide

This directory contains the smart contracts for decentralized reward distribution.

## Overview

**Migration Goal:** Move from centralized backend-controlled rewards to trustless smart contract-based distribution.

**Before:** Backend holds private keys and sends ASA directly
**After:** Smart contract holds ASA and auto-pays on validator approval

---

## Prerequisites

1. **Existing ASA:** You already have a LearnToken ASA created
2. **Wallet with ASA:** Your wallet holds ASA tokens to transfer to the contract
3. **24-word mnemonic:** Your BIP-39 mnemonic phrase from Pera Wallet
4. **TestNet ALGO:** At least 0.5 ALGO for deployment and transactions

---

## Quick Start

### Step 1: Install Dependencies

```bash
cd contracts
npm install
```

### Step 2: Configure Environment

```bash
# Copy the example and fill in your values
cp .env.example .env
```

Edit `.env`:
```env
ALGOD_URL=https://testnet-api.algonode.cloud
ALGOD_TOKEN=

# Your 24-word mnemonic (same one that holds the ASA)
MNEMONIC=word1 word2 word3 ... word24

# Optional passphrase (leave empty if you didn't set one)
BIP39_PASS=

# HD derivation path (usually 0/0 for first address)
ACCOUNT=0
INDEX=0

# Your existing ASA ID
ASA_ID=your_asa_id_here

# Will be filled automatically after deployment
SMART_CONTRACT_APP_ID=
```

### Step 3: Compile Smart Contract

```bash
npm run compile
```

This generates:
- `RewardContract.approval.teal` - Contract logic
- `RewardContract.clear.teal` - Opt-out logic
- `RewardContract.abi.json` - ABI for frontend

### Step 4: Deploy to TestNet

```bash
npm run deploy
```

Expected output:
```
✅ Contract Deployed Successfully!
   App ID: 123456789
   Contract Address: ABCDEF...XYZ123
   View on AlgoExplorer: https://testnet.algoexplorer.io/application/123456789
```

The `.env` file is automatically updated with `SMART_CONTRACT_APP_ID`.

### Step 5: Fund Contract with ASA

```bash
npm run fund
```

This will:
1. Opt the contract into your ASA
2. Transfer 1,000 ASA tokens from your wallet to the contract
3. Verify the contract can now distribute rewards

Expected output:
```
✅ Contract Funded Successfully!
   Contract ASA balance: 1000 tokens
   Can distribute 10 rewards (100 tokens each)
```

### Step 6: Test Contract

```bash
npm run test
```

This runs end-to-end tests:
- Creates a test learner account
- Simulates validator approval
- Verifies learner receives 100 ASA
- Checks contract balance decreased

If all tests pass, you're ready to integrate!

---

## Backend Integration

### Step 1: Update Backend .env

The `deploy.ts` script should have already updated `backend/.env` with the smart contract ID.

Verify `backend/.env` has:
```env
SMART_CONTRACT_APP_ID=your_contract_id
USE_SMART_CONTRACT=true
```

### Step 2: Restart Backend

```bash
cd backend
npm run dev
```

You should see:
```
- USE_SMART_CONTRACT: TRUE (Decentralized)
- SMART_CONTRACT_APP_ID: 123456789
```

### Step 3: Test End-to-End

1. Start frontend: `cd frontend && npm run dev`
2. Connect wallet with Pera
3. Submit a PR URL
4. Go to `/volunteer` page
5. Click "Pass & Send ASA"
6. Check AlgoExplorer - transaction should be from the smart contract, not your wallet!

---

## Architecture

### Smart Contract: `RewardContract.algo.ts`

**State:**
- `validator`: Address that can approve submissions
- `asaId`: Which ASA to distribute
- `rewardAmount`: How much per approval (100 tokens)

**Methods:**
- `createApplication()`: Initialize contract on deployment
- `optInToAsa()`: Contract opts into ASA (required before receiving)
- `approveAndPay(learner)`: Validator approves → auto-pays learner
- `getBalance()`: Check how many rewards left
- `updateValidator()`: Change validator address
- `updateRewardAmount()`: Change reward amount

### Backend Integration: `backend/server.js`

**Feature Flag:**
```javascript
const USE_SMART_CONTRACT = process.env.USE_SMART_CONTRACT === 'true';
```

**Two Modes:**
- `USE_SMART_CONTRACT=false`: Backend sends ASA directly (centralized)
- `USE_SMART_CONTRACT=true`: Backend calls smart contract (decentralized)

**New Function:**
```javascript
async function approveViaContract(recipientAddress) {
  // Calls smart contract's approveAndPay method
  // Contract automatically sends ASA to learner
}
```

---

## File Structure

```
contracts/
├── RewardContract.algo.ts          # Smart contract (TypeScript)
├── deploy.ts                        # Deploy to TestNet
├── fund-contract.ts                 # Transfer ASA to contract
├── test.ts                          # End-to-end tests
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config
├── .env.example                     # Environment template
└── README.md                        # This file

# Generated after compilation:
├── RewardContract.approval.teal     # Compiled contract
├── RewardContract.clear.teal        # Compiled clear program
└── RewardContract.abi.json          # ABI for frontend
```

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contract to TEAL |
| `npm run deploy` | Deploy contract to TestNet |
| `npm run fund` | Transfer 1000 ASA to contract |
| `npm run test` | Run end-to-end tests |
| `npm run setup-all` | Compile + deploy + fund (all at once) |

---

## Troubleshooting

### Error: "MNEMONIC not set"
- Copy `.env.example` to `.env`
- Fill in your 24-word mnemonic from Pera Wallet

### Error: "Invalid BIP-39 mnemonic"
- Check spelling and word order
- Ensure it's exactly 24 words
- Remove extra spaces

### Error: "Insufficient funds"
- Get more TestNet ALGO from https://bank.testnet.algorand.network/
- You need at least 0.5 ALGO

### Error: "You have no ASA tokens"
- Verify `ASA_ID` in `.env` is correct
- Check that your wallet actually holds that ASA
- Use AlgoExplorer to view your wallet's assets

### Error: "TEAL files not found"
- Run `npm run compile` first before deploying

### Contract deployed but backend still centralized
- Check `backend/.env` has `USE_SMART_CONTRACT=true`
- Restart backend server: `npm run dev`

---

## Security Notes

⚠️ **TestNet Only:** This is for demo purposes only. Never use TestNet mnemonics/keys with MainNet funds.

🔐 **Mnemonic Safety:** Keep your `.env` file private. Never commit it to git.

🛡️ **Production Recommendations:**
- Use separate validator account (not the same as org account)
- Implement multi-sig for high-value contracts
- Add rate limiting to prevent spam approvals
- Audit smart contract before MainNet deployment

---

## Next Steps

### For Hackathon Demo:

1. **Show centralized mode:**
   - Set `USE_SMART_CONTRACT=false`
   - Approve a submission
   - Show transaction is from your wallet

2. **Switch to decentralized mode:**
   - Set `USE_SMART_CONTRACT=true`
   - Restart backend
   - Approve a submission
   - Show transaction is from smart contract!

3. **Highlight benefits:**
   - "Contract holds funds, not our server"
   - "Code guarantees payment, not humans"
   - "Anyone can verify on AlgoExplorer"

### Post-Hackathon Improvements:

- [ ] Add GitHub webhook oracle for automatic PR verification
- [ ] Implement multi-validator approval (2-of-3 signatures)
- [ ] Create DAO for course management
- [ ] Add reputation system for validators
- [ ] Integrate partner purchases with smart contracts
- [ ] Deploy to MainNet (after audit!)

---

## Resources

- **Algorand Docs:** https://developer.algorand.org/
- **TEALScript Docs:** https://tealscript.netlify.app/
- **TestNet Explorer:** https://testnet.algoexplorer.io/
- **TestNet Dispenser:** https://bank.testnet.algorand.network/

---

## Support

Having issues? Check:
1. This README's troubleshooting section
2. Console output for error messages
3. AlgoExplorer to verify transactions
4. Backend logs when the server starts

**Happy building! 🚀**
