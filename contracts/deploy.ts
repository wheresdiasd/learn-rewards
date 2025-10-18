import algosdk from 'algosdk';
import * as bip39 from 'bip39';
import { XHDWalletAPI, fromSeed, KeyContext } from '@algorandfoundation/xhd-wallet-api';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

/**
 * Deploy the RewardContract smart contract to Algorand TestNet
 * Uses BIP-39 24-word mnemonic for wallet derivation
 */

function normalize(m: string): string {
  return m.trim().replace(/\s+/g, ' ').toLowerCase();
}

async function keyGenCompat(
  xhd: XHDWalletAPI,
  root: any,
  account: number,
  index: number
): Promise<Uint8Array> {
  try {
    return await xhd.keyGen(root, KeyContext.Address, account, index);
  } catch {}
  return await xhd.keyGen(root, KeyContext.Address, account, 0, index);
}

async function signCompat(
  xhd: XHDWalletAPI,
  root: any,
  account: number,
  index: number,
  messageBytes: Uint8Array
): Promise<Uint8Array> {
  try {
    return await xhd.signAlgoTransaction(
      root, KeyContext.Address, account, 0, index, messageBytes
    );
  } catch {
    return await xhd.signAlgoTransaction(
      root, KeyContext.Address, account, index, messageBytes
    );
  }
}

async function derive24(
  mnemonic: string,
  { account, index, passphrase }: { account: number; index: number; passphrase: string }
) {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid BIP-39 mnemonic');
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
  const root = fromSeed(seed);
  const xhd = new XHDWalletAPI();
  const pub = await keyGenCompat(xhd, root, account, index);
  const addr = algosdk.encodeAddress(pub);

  async function signTxn(txn: algosdk.Transaction) {
    const bytes = txn.bytesToSign();
    const sig = await signCompat(xhd, root, account, index, bytes);
    return txn.attachSignature(addr, sig);
  }

  return { addr, signTxn, path: `m/44'/283'/${account}'/0/${index}` };
}

async function deploy() {
  console.log('📦 Deploying RewardContract to TestNet...\n');

  const MNEMONIC = process.env.MNEMONIC || '';
  const BIP39_PASS = process.env.BIP39_PASS || '';
  const ACCOUNT = parseInt(process.env.ACCOUNT ?? '0', 10);
  const INDEX = parseInt(process.env.INDEX ?? '0', 10);
  const asaId = parseInt(process.env.ASA_ID || '0');

  if (!MNEMONIC) {
    throw new Error('MNEMONIC not set in .env');
  }
  if (!asaId) {
    throw new Error('ASA_ID not set in .env');
  }

  const m = normalize(MNEMONIC);
  const { addr, signTxn, path } = await derive24(m, {
    account: ACCOUNT,
    index: INDEX,
    passphrase: BIP39_PASS,
  });

  console.log(`Deploying from: ${addr}`);
  console.log(`Derivation Path: ${path}`);
  console.log(`ASA ID: ${asaId}\n`);

  const algodClient = new algosdk.Algodv2(
    process.env.ALGOD_TOKEN || '',
    process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud',
    ''
  );

  // Check balance
  const accountInfo = await algodClient.accountInformation(addr).do();
  const balance = accountInfo.amount / 1_000_000;
  console.log(`Account Balance: ${balance} ALGO`);
  if (balance < 0.2) {
    throw new Error('Insufficient balance. Need at least 0.2 ALGO for deployment');
  }

  // Read compiled TEAL files
  const approvalPath = path.join(__dirname, 'RewardContract.approval.teal');
  const clearPath = path.join(__dirname, 'RewardContract.clear.teal');

  if (!fs.existsSync(approvalPath) || !fs.existsSync(clearPath)) {
    throw new Error(
      'TEAL files not found. Run "npm run compile" first to compile RewardContract.algo.ts'
    );
  }

  const approvalProgram = fs.readFileSync(approvalPath, 'utf8');
  const clearProgram = fs.readFileSync(clearPath, 'utf8');

  console.log('📝 Compiling TEAL to bytecode...');
  const approvalCompiled = await algodClient.compile(approvalProgram).do();
  const clearCompiled = await algodClient.compile(clearProgram).do();

  const params = await algodClient.getTransactionParams().do();

  // Application arguments for createApplication method
  // Args: validator (Address), asaId (uint64), rewardAmount (uint64)
  const appArgs = [
    algosdk.decodeAddress(addr).publicKey,  // validator = deployer
    algosdk.encodeUint64(asaId),            // ASA ID
    algosdk.encodeUint64(100),              // reward amount = 100 tokens
  ];

  console.log('🚀 Creating application on TestNet...');
  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: addr,
    suggestedParams: params,
    approvalProgram: new Uint8Array(Buffer.from(approvalCompiled.result, 'base64')),
    clearProgram: new Uint8Array(Buffer.from(clearCompiled.result, 'base64')),
    numGlobalByteSlices: 1,  // validator address
    numGlobalInts: 2,        // asaId, rewardAmount
    numLocalByteSlices: 0,
    numLocalInts: 0,
    appArgs,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
  });

  const signedTxn = await signTxn(txn);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

  console.log('⏳ Waiting for confirmation...');
  const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
  const appId = result['application-index'];
  const contractAddress = algosdk.getApplicationAddress(appId);

  console.log(`\n✅ Contract Deployed Successfully!`);
  console.log(`   App ID: ${appId}`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Transaction: ${txId}`);
  console.log(`   View on AlgoExplorer: https://testnet.algoexplorer.io/application/${appId}\n`);

  // Update .env file
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('SMART_CONTRACT_APP_ID=')) {
      envContent = envContent.replace(/SMART_CONTRACT_APP_ID=.*/, `SMART_CONTRACT_APP_ID=${appId}`);
    } else {
      envContent += `\nSMART_CONTRACT_APP_ID=${appId}`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log('💾 Updated contracts/.env with SMART_CONTRACT_APP_ID\n');
  }

  // Update backend .env
  const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
  if (fs.existsSync(backendEnvPath)) {
    let backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
    if (backendEnvContent.includes('SMART_CONTRACT_APP_ID=')) {
      backendEnvContent = backendEnvContent.replace(/SMART_CONTRACT_APP_ID=.*/, `SMART_CONTRACT_APP_ID=${appId}`);
    } else {
      backendEnvContent += `\nSMART_CONTRACT_APP_ID=${appId}`;
    }
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('💾 Updated backend/.env with SMART_CONTRACT_APP_ID\n');
  }

  console.log('🎉 Next Steps:');
  console.log('   1. Run: npm run fund    (Fund contract with ASA tokens)');
  console.log('   2. Test the contract\n');

  return appId;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  deploy().catch((error) => {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  });
}

export { deploy };
