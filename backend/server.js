import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import algosdk from 'algosdk';
import * as bip39 from 'bip39';
import { XHDWalletAPI, fromSeed, KeyContext } from '@algorandfoundation/xhd-wallet-api';

const app = express();
const PORT = 3001;
const DATA_FILE = './data.json';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize data file
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData = {
      user: {
        id: 1,
        displayName: 'Default Learner',
        walletAddress: null,
      },
      submissions: [],
      rewards: [],
      partners: [
        {
          id: 1,
          name: 'MIT OpenCourseWare',
          description: 'Access advanced computer science courses from MIT.',
          imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop',
          asaCost: 100,
        },
        {
          id: 2,
          name: 'Stanford Online',
          description: 'Learn AI and machine learning from Stanford professors.',
          imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
          asaCost: 150,
        },
        {
          id: 3,
          name: 'Harvard CS50',
          description: 'Introduction to computer science and programming.',
          imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=300&fit=crop',
          asaCost: 120,
        },
        {
          id: 4,
          name: 'Berkeley Blockchain',
          description: 'Deep dive into blockchain technology and cryptocurrencies.',
          imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
          asaCost: 200,
        },
        {
          id: 5,
          name: 'Oxford AI Ethics',
          description: 'Explore the ethical implications of artificial intelligence.',
          imageUrl: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=400&h=300&fit=crop',
          asaCost: 180,
        },
        {
          id: 6,
          name: 'Algorand Developer Bootcamp',
          description: 'Master smart contract development on Algorand.',
          imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
          asaCost: 250,
        },
      ],
      purchases: [],
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read data
async function readData() {
  const data = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Write data
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Feature flag: Use smart contract or centralized approach
const USE_SMART_CONTRACT = process.env.USE_SMART_CONTRACT === 'true';

// Algorand setup
function getAlgodClient() {
  const algodToken = process.env.ALGOD_TOKEN || '';
  const algodServer = process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud';
  const algodPort = '';
  return new algosdk.Algodv2(algodToken, algodServer, algodPort);
}

// Helper functions for BIP-39 mnemonic handling
function normalize(m) {
  return m.trim().replace(/\s+/g, ' ').toLowerCase();
}

async function keyGenCompat(xhd, root, account, index) {
  try {
    return await xhd.keyGen(root, KeyContext.Address, account, index);
  } catch {}
  return await xhd.keyGen(root, KeyContext.Address, account, 0, index);
}

async function signCompat(xhd, root, account, index, messageBytes) {
  try {
    return await xhd.signAlgoTransaction(root, KeyContext.Address, account, 0, index, messageBytes);
  } catch {
    return await xhd.signAlgoTransaction(root, KeyContext.Address, account, index, messageBytes);
  }
}

async function derive24(mnemonic, { account, index, passphrase }) {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid BIP-39 mnemonic');
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
  const root = fromSeed(seed);
  const xhd = new XHDWalletAPI();
  const pub = await keyGenCompat(xhd, root, account, index);
  const addr = algosdk.encodeAddress(pub);

  async function signTxn(txn) {
    const bytes = txn.bytesToSign();
    const sig = await signCompat(xhd, root, account, index, bytes);
    return txn.attachSignature(addr, sig);
  }

  return { addr, signTxn };
}

// NEW: Smart contract approval function
async function approveViaContract(recipientAddress) {
  try {
    const appId = parseInt(process.env.SMART_CONTRACT_APP_ID || '0');
    const mnemonic = process.env.MNEMONIC;
    const bip39Pass = process.env.BIP39_PASS || '';
    const account = parseInt(process.env.ACCOUNT ?? '0', 10);
    const index = parseInt(process.env.INDEX ?? '0', 10);

    if (!appId) {
      throw new Error('SMART_CONTRACT_APP_ID not configured');
    }
    if (!mnemonic) {
      throw new Error('MNEMONIC not configured');
    }

    const algodClient = getAlgodClient();

    // Derive account from BIP-39 mnemonic
    const m = normalize(mnemonic);
    const { addr, signTxn } = await derive24(m, {
      account,
      index,
      passphrase: bip39Pass,
    });

    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Get ASA ID from env
    const asaId = parseInt(process.env.ASA_ID || '0');
    if (!asaId) {
      throw new Error('ASA_ID not configured');
    }

    // Call smart contract's approveAndPay method
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      from: addr,
      appIndex: appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new Uint8Array(Buffer.from('approveAndPay')),
        algosdk.decodeAddress(recipientAddress).publicKey,
      ],
      foreignAssets: [asaId],
      suggestedParams,
    });

    const signedTxn = await signTxn(appCallTxn);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    console.log('Smart contract approval confirmed:', txId);

    return { txId, amount: 100 }; // Keep same return signature
  } catch (error) {
    console.error('Smart contract approval error:', error);
    throw error;
  }
}

// LEGACY: Centralized ASA transfer (kept for fallback)
async function sendASAReward(recipientAddress) {
  try {
    const mnemonic = process.env.MNEMONIC;
    const bip39Pass = process.env.BIP39_PASS || '';
    const account = parseInt(process.env.ACCOUNT ?? '0', 10);
    const index = parseInt(process.env.INDEX ?? '0', 10);
    const asaId = parseInt(process.env.ASA_ID || '0');

    if (!mnemonic) {
      throw new Error('MNEMONIC not configured');
    }
    if (!asaId) {
      throw new Error('ASA_ID not configured');
    }

    const algodClient = getAlgodClient();

    // Derive account from BIP-39 mnemonic
    const m = normalize(mnemonic);
    const { addr, signTxn } = await derive24(m, {
      account,
      index,
      passphrase: bip39Pass,
    });

    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Create asset transfer transaction
    const amount = 100; // 100 ASA units (adjust based on decimals)
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: addr,
      to: recipientAddress,
      amount: amount,
      assetIndex: asaId,
      suggestedParams,
    });

    // Sign the transaction
    const signedTxn = await signTxn(txn);

    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    console.log('Transaction confirmed in round:', confirmedTxn['confirmed-round']);

    return { txId, amount };
  } catch (error) {
    console.error('ASA transfer error:', error);
    throw error;
  }
}

// API Routes

// GET /api/me
app.get('/api/me', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/wallet
app.post('/api/wallet', async (req, res) => {
  try {
    const { address } = req.body;
    const data = await readData();
    data.user.walletAddress = address;
    await writeData(data);
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/submissions - Get submissions
// If walletAddress query param is provided, filter by that wallet (for students)
// Otherwise, return all submissions (for Volunteer page)
app.get('/api/submissions', async (req, res) => {
  try {
    const { walletAddress } = req.query;
    const data = await readData();

    if (walletAddress) {
      // Filter submissions for this specific wallet
      const userSubmissions = data.submissions.filter(
        s => s.walletAddress === walletAddress
      );
      res.json(userSubmissions);
    } else {
      // Return all submissions (for volunteer panel)
      res.json(data.submissions);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/submission - Create a new submission
app.post('/api/submission', async (req, res) => {
  try {
    const { prUrl, walletAddress } = req.body;
    const data = await readData();

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Generate new submission ID
    const newId = data.submissions.length > 0
      ? Math.max(...data.submissions.map(s => s.id)) + 1
      : 1;

    const newSubmission = {
      id: newId,
      userId: data.user.id, // Keep for backwards compatibility
      prUrl,
      walletAddress,
      status: 'draft',
      txId: null,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };

    data.submissions.push(newSubmission);
    await writeData(data);
    res.json(newSubmission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/review/pass - Approve a submission by ID
app.post('/api/review/pass', async (req, res) => {
  try {
    const { submissionId } = req.body;
    const data = await readData();

    // Find the submission
    const submission = data.submissions.find(s => s.id === submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (!submission.walletAddress) {
      return res.status(400).json({ error: 'No wallet address connected' });
    }

    if (submission.status !== 'draft') {
      return res.status(400).json({ error: 'Submission already reviewed' });
    }

    // Send ASA reward (smart contract or centralized based on feature flag)
    const { txId, amount } = USE_SMART_CONTRACT
      ? await approveViaContract(submission.walletAddress)
      : await sendASAReward(submission.walletAddress);

    // Update submission
    submission.status = 'approved';
    submission.txId = txId;
    submission.reviewedAt = new Date().toISOString();

    // Add reward record
    data.rewards.push({
      submissionId,
      amount,
      txId,
      createdAt: new Date().toISOString(),
    });

    await writeData(data);
    res.json(submission);
  } catch (error) {
    console.error('Pass review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/review/fail - Reject a submission by ID
app.post('/api/review/fail', async (req, res) => {
  try {
    const { submissionId } = req.body;
    const data = await readData();

    // Find the submission
    const submission = data.submissions.find(s => s.id === submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.status !== 'draft') {
      return res.status(400).json({ error: 'Submission already reviewed' });
    }

    submission.status = 'rejected';
    submission.reviewedAt = new Date().toISOString();
    await writeData(data);
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rewards?address=WALLET_ADDRESS - Returns LEARN coin (ASA) rewards from blockchain for specified wallet
app.get('/api/rewards', async (req, res) => {
  try {
    const walletAddress = req.query.address;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address parameter required' });
    }

    // Validate Algorand address format
    if (!algosdk.isValidAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Algorand address' });
    }

    const asaId = parseInt(process.env.ASA_ID || '0');
    if (!asaId) {
      return res.status(500).json({ error: 'ASA_ID not configured' });
    }

    const indexerUrl = process.env.INDEXER_URL || 'https://testnet-idx.algonode.cloud';
    const indexerClient = new algosdk.Indexer('', indexerUrl, '');

    // Query all transactions for this wallet (includes app calls with inner txns)
    const txnResponse = await indexerClient
      .searchForTransactions()
      .address(walletAddress)
      .do();

    const incomingTxns = [];

    // Process transactions to find incoming LEARN coin transfers
    for (const txn of txnResponse.transactions) {
      // Check top-level asset transfers
      if (txn['tx-type'] === 'axfer') {
        const assetTransfer = txn['asset-transfer-transaction'];
        if (assetTransfer &&
            assetTransfer['asset-id'] === asaId &&
            assetTransfer.receiver === walletAddress &&
            txn.sender !== walletAddress) {
          incomingTxns.push({
            amount: assetTransfer.amount,
            txId: txn.id,
            createdAt: new Date(txn['round-time'] * 1000).toISOString(),
            sender: txn.sender,
            round: txn['confirmed-round'],
          });
        }
      }

      // Check inner transactions (from smart contract calls)
      if (txn['inner-txns']) {
        for (const innerTxn of txn['inner-txns']) {
          if (innerTxn['tx-type'] === 'axfer') {
            const assetTransfer = innerTxn['asset-transfer-transaction'];
            if (assetTransfer &&
                assetTransfer['asset-id'] === asaId &&
                assetTransfer.receiver === walletAddress) {
              incomingTxns.push({
                amount: assetTransfer.amount,
                txId: txn.id, // Parent transaction ID
                createdAt: new Date(txn['round-time'] * 1000).toISOString(),
                sender: assetTransfer.sender,
                round: txn['confirmed-round'],
                fromContract: true,
              });
            }
          }
        }
      }
    }

    res.json(incomingTxns);
  } catch (error) {
    console.error('Error fetching blockchain rewards:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/partners
app.get('/api/partners', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/partners/:id/purchase
app.post('/api/partners/:id/purchase', async (req, res) => {
  try {
    const partnerId = parseInt(req.params.id);
    const data = await readData();

    const partner = data.partners.find((p) => p.id === partnerId);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Generate fake order ID
    const fakeOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Record purchase (simulated)
    data.purchases.push({
      partnerId,
      partnerName: partner.name,
      amount: partner.asaCost,
      orderId: fakeOrderId,
      createdAt: new Date().toISOString(),
    });

    await writeData(data);
    res.json({ status: 'success', fakeOrderId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start server
await initDataFile();

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Environment check:');
  console.log('- ALGOD_URL:', process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud (default)');
  console.log('- ASA_ID:', process.env.ASA_ID || 'NOT SET');
  console.log('- ORG_PRIVATE_KEY:', process.env.ORG_PRIVATE_KEY ? 'SET' : 'NOT SET');
  console.log('- USE_SMART_CONTRACT:', USE_SMART_CONTRACT ? 'TRUE (Decentralized)' : 'FALSE (Centralized)');
  if (USE_SMART_CONTRACT) {
    console.log('- SMART_CONTRACT_APP_ID:', process.env.SMART_CONTRACT_APP_ID || 'NOT SET');
  }
});
