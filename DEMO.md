# Demo Script - Algorand Learning Platform MVP

Follow these steps to demonstrate the complete MVP flow.

## Prerequisites

✓ Backend running on http://localhost:3001
✓ Frontend running on http://localhost:5173
✓ Backend .env configured with ORG_MNEMONIC and ASA_ID
✓ Organization wallet funded with TestNet ALGO
✓ Pera Wallet app installed (for wallet connection demo)

## Demo Flow

### Step 1: Home Page - Course Introduction

**URL**: http://localhost:5173

**Show**:
- Course title: "Introduction to Blockchain Development"
- Course content with Module 1, Lecture 1
- Assignment description

**Say**: "This is our learning platform where students can take blockchain courses. For this MVP, we have a single course focused on Algorand basics."

---

### Step 2: Connect Wallet

**Action**: Click "Connect Pera Wallet" button

**Show**:
- QR code or wallet connection flow
- Approve connection in Pera Wallet
- Wallet address displayed on page

**Say**: "Students connect their Algorand wallet using Pera Wallet Connect. This wallet will receive ASA token rewards when their assignments are approved."

---

### Step 3: Submit Assignment

**Action**:
1. Enter a sample PR URL: `https://github.com/algorand/go-algorand/pull/1`
2. Click "Submit PR"

**Show**:
- Success message
- Status shows "DRAFT"

**Say**: "After completing the assignment, students submit their pull request URL for volunteer review."

---

### Step 4: Volunteer Review Panel

**URL**: http://localhost:5173/volunteer

**Show**:
- PR URL displayed
- Learner's wallet address
- Pass/Fail buttons
- Current status

**Say**: "Volunteers can review student submissions through this simple panel. When they click 'Pass', a real Algorand transaction is triggered."

**Action**: Click "Pass & Send ASA"

**Show**:
- Loading state
- Success message with Transaction ID
- Status changes to "APPROVED"

**Say**: "The backend just sent 100 ASA tokens from our organization wallet to the student's wallet. This is a real transaction on Algorand TestNet."

---

### Step 5: View Rewards

**URL**: http://localhost:5173/rewards

**Show**:
- Total earned: 100 ASA
- Transaction history table with:
  - Amount
  - Date/time
  - Transaction ID (clickable link to AlgoExplorer)

**Action**: Click the transaction ID link

**Show**: AlgoExplorer TestNet page confirming the transaction

**Say**: "Students can track all their earned rewards. Each transaction is verifiable on the Algorand blockchain through AlgoExplorer."

---

### Step 6: Partner Directory

**URL**: http://localhost:5173/partners

**Show**:
- Grid of 6 educational partners:
  1. MIT OpenCourseWare (100 ASA)
  2. Stanford Online (150 ASA)
  3. Harvard CS50 (120 ASA)
  4. Berkeley Blockchain (200 ASA)
  5. Oxford AI Ethics (180 ASA)
  6. Algorand Developer Bootcamp (250 ASA)

**Say**: "Students can use their earned ASA tokens to access learning opportunities from partner institutions."

**Action**: Click "Buy with ASA" on any partner (e.g., MIT OpenCourseWare)

---

### Step 7: Purchase Success

**Show**:
- Success checkmark
- Partner name
- Order ID
- Amount paid
- Note about simulation

**Say**: "For this MVP, partner purchases are simulated - no actual payment occurs. In production, this would integrate with real payment processing or smart contracts."

---

## Key Points to Highlight

### Technical Implementation

1. **Real Blockchain Integration**: ASA transfers are actual Algorand TestNet transactions
2. **Pera Wallet Integration**: Standard Algorand wallet connection using WalletConnect protocol
3. **Simple Architecture**: React frontend, Node.js backend, JSON file persistence
4. **Zero Auth**: No login/signup for rapid prototyping

### MVP Scope

1. **What Works**:
   - Wallet connection (Pera Wallet)
   - PR submission
   - Volunteer review with Pass/Fail
   - Real ASA transfer on Algorand TestNet
   - Transaction history
   - Partner directory

2. **Intentional Simplifications** (for 2-day hackathon):
   - Single default user
   - No authentication
   - One course/module/lecture
   - JSON file instead of database
   - Simulated partner purchases
   - No rate limiting or security

### Algorand Features Demonstrated

- ✓ Asset transfers (makeAssetTransferTxnWithSuggestedParamsFromObject)
- ✓ Transaction signing
- ✓ Transaction confirmation
- ✓ TestNet integration
- ✓ Standard wallet integration (Pera)

### Future Enhancements

- Multi-user support with auth
- Database (PostgreSQL)
- Multiple courses/modules
- Smart contracts for trustless reward distribution
- Real partner payment integration
- Volunteer reputation system
- Achievement badges as NFTs

---

## Troubleshooting During Demo

### Wallet Won't Connect
- Check Pera Wallet app is open
- Ensure phone and computer are on same network
- Try refreshing the page

### ASA Transfer Fails
- Verify backend .env has correct mnemonic and ASA_ID
- Check organization wallet has TestNet ALGO for fees
- Learner wallet may need to opt-in to the ASA first

### Transaction Not Showing
- Wait 4-5 seconds for blockchain confirmation
- Refresh the Rewards page
- Check AlgoExplorer directly with the transaction ID

---

## Demo Timing

- Total demo: ~5-7 minutes
- Step 1-3 (Course + Submission): 2 min
- Step 4-5 (Review + Rewards): 2 min
- Step 6-7 (Partners): 1-2 min
- Q&A: 2-3 min

---

## Questions to Anticipate

**Q: Is this on mainnet?**
A: No, TestNet only. TestNet tokens have no real value.

**Q: How do you prevent spam?**
A: This MVP has no rate limiting. Production would need auth, rate limits, and validation.

**Q: Why not use smart contracts for rewards?**
A: Time constraint for 2-day hackathon. Future version could use smart contracts for trustless distribution.

**Q: Can volunteers be malicious?**
A: Yes, in this MVP there's no access control. Production needs role-based auth and audit logs.

**Q: What happens if the org wallet runs out of ASA?**
A: Transaction fails. Would need monitoring and alerts in production.
