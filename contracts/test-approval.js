import 'dotenv/config';
import algosdk from 'algosdk';
import * as bip39 from 'bip39';
import { XHDWalletAPI, fromSeed, KeyContext } from '@algorandfoundation/xhd-wallet-api';

// Configuration
const APP_ID = parseInt(process.env.SMART_CONTRACT_APP_ID || '0');
const ASA_ID = parseInt(process.env.ASA_ID || '0');
const ALGOD_URL = process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud';
const MNEMONIC = process.env.MNEMONIC;
const BIP39_PASS = process.env.BIP39_PASS || '';
const ACCOUNT = parseInt(process.env.ACCOUNT ?? '0', 10);
const INDEX = parseInt(process.env.INDEX ?? '0', 10);

// Test recipient address (replace with a valid test address or use your wallet)
const TEST_RECIPIENT = process.env.TEST_RECIPIENT_ADDRESS || '5K747IR5K27IO4HAB6ON7UMLXXTYJIS4HZEXX5XO5HT2J4QW377WCPNAEQ';

const algodClient = new algosdk.Algodv2('', ALGOD_URL, '');

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

async function testApproval() {
  console.log('🧪 Testing Smart Contract Approval\n');

  // Validate environment
  if (!APP_ID) {
    console.error('❌ SMART_CONTRACT_APP_ID not set');
    process.exit(1);
  }
  if (!ASA_ID) {
    console.error('❌ ASA_ID not set');
    process.exit(1);
  }
  if (!MNEMONIC) {
    console.error('❌ MNEMONIC not set');
    process.exit(1);
  }
  if (TEST_RECIPIENT === 'YOUR_TEST_WALLET_ADDRESS') {
    console.error('❌ TEST_RECIPIENT_ADDRESS not set');
    console.log('💡 Add TEST_RECIPIENT_ADDRESS to your .env file or pass a wallet address');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log('  App ID:', APP_ID);
  console.log('  ASA ID:', ASA_ID);
  console.log('  Recipient:', TEST_RECIPIENT);
  console.log('  Algod URL:', ALGOD_URL);
  console.log('  Account Index:', ACCOUNT);
  console.log('  Key Index:', INDEX);
  console.log();

  try {
    // Derive account from BIP-39 mnemonic
    console.log('🔑 Deriving account from BIP-39 mnemonic...');
    const m = normalize(MNEMONIC);
    const { addr, signTxn } = await derive24(m, {
      account: ACCOUNT,
      index: INDEX,
      passphrase: BIP39_PASS,
    });
    console.log('  Sender Address:', addr);
    console.log();

    // Get suggested params
    console.log('📡 Getting transaction parameters...');
    const suggestedParams = await algodClient.getTransactionParams().do();
    console.log('  Fee:', suggestedParams.fee);
    console.log('  First Valid Round:', suggestedParams.firstRound);
    console.log();

    // Create application call transaction
    console.log('📝 Creating application call transaction...');
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      from: addr,
      appIndex: APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new Uint8Array(Buffer.from('approveAndPay')),
        algosdk.decodeAddress(TEST_RECIPIENT).publicKey,
      ],
      foreignAssets: [ASA_ID],
      suggestedParams,
    });
    console.log('  Transaction created successfully ✅');
    console.log();

    // Sign the transaction
    console.log('✍️  Signing transaction...');
    const signedTxn = await signTxn(appCallTxn);
    console.log('  Transaction signed successfully ✅');
    console.log();

    // Send the transaction
    console.log('📤 Sending transaction to network...');
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log('  Transaction ID:', txId);
    console.log();

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log('  ✅ Transaction confirmed in round:', confirmedTxn['confirmed-round']);
    console.log();

    console.log('🎉 SUCCESS! Smart contract approval completed.');
    console.log('🔗 View on AlgoExplorer: https://testnet.algoexplorer.io/tx/' + txId);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body || error.response.text);
    }
    process.exit(1);
  }
}

testApproval();
