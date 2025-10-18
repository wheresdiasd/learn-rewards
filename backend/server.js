import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import algosdk from 'algosdk';

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
      submission: {
        prUrl: '',
        status: 'draft',
        txId: null,
      },
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

// NEW: Smart contract approval function
async function approveViaContract(recipientAddress) {
  try {
    const appId = parseInt(process.env.SMART_CONTRACT_APP_ID || '0');
    const privateKey = process.env.ORG_PRIVATE_KEY;

    if (!appId) {
      throw new Error('SMART_CONTRACT_APP_ID not configured');
    }
    if (!privateKey) {
      throw new Error('ORG_PRIVATE_KEY not configured');
    }

    const algodClient = getAlgodClient();

    // Decode the base64 private key
    const secretKey = new Uint8Array(Buffer.from(privateKey, 'base64'));
    const account = { sk: secretKey, addr: algosdk.encodeAddress(secretKey.slice(32)) };

    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Call smart contract's approveAndPay method
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      from: account.addr,
      appIndex: appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new Uint8Array(Buffer.from('approveAndPay')),
        algosdk.decodeAddress(recipientAddress).publicKey,
      ],
      suggestedParams,
    });

    const signedTxn = appCallTxn.signTxn(account.sk);
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
    const privateKey = process.env.ORG_PRIVATE_KEY;
    const asaId = parseInt(process.env.ASA_ID || '0');

    if (!privateKey) {
      throw new Error('ORG_PRIVATE_KEY not configured');
    }
    if (!asaId) {
      throw new Error('ASA_ID not configured');
    }

    const algodClient = getAlgodClient();

    // Decode the base64 private key
    const secretKey = new Uint8Array(Buffer.from(privateKey, 'base64'));
    const account = { sk: secretKey, addr: algosdk.encodeAddress(secretKey.slice(32)) };

    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Create asset transfer transaction
    const amount = 100; // 100 ASA units (adjust based on decimals)
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: account.addr,
      to: recipientAddress,
      amount: amount,
      assetIndex: asaId,
      suggestedParams,
    });

    // Sign the transaction
    const signedTxn = txn.signTxn(account.sk);

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
    data.submission.walletAddress = address;
    await writeData(data);
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/submission
app.get('/api/submission', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/submission
app.post('/api/submission', async (req, res) => {
  try {
    const { prUrl } = req.body;
    const data = await readData();
    data.submission.prUrl = prUrl;
    data.submission.status = 'draft';
    await writeData(data);
    res.json(data.submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/review/pass
app.post('/api/review/pass', async (req, res) => {
  try {
    const data = await readData();

    if (!data.submission.walletAddress) {
      return res.status(400).json({ error: 'No wallet address connected' });
    }

    // Send ASA reward (smart contract or centralized based on feature flag)
    const { txId, amount } = USE_SMART_CONTRACT
      ? await approveViaContract(data.submission.walletAddress)
      : await sendASAReward(data.submission.walletAddress);

    // Update submission
    data.submission.status = 'approved';
    data.submission.txId = txId;

    // Add reward record
    data.rewards.push({
      amount,
      txId,
      createdAt: new Date().toISOString(),
    });

    await writeData(data);
    res.json(data.submission);
  } catch (error) {
    console.error('Pass review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/review/fail
app.post('/api/review/fail', async (req, res) => {
  try {
    const data = await readData();
    data.submission.status = 'rejected';
    await writeData(data);
    res.json(data.submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rewards
app.get('/api/rewards', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.rewards);
  } catch (error) {
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
