import algosdk from 'algosdk';
import * as bip39 from 'bip39';
import { XHDWalletAPI, fromSeed, KeyContext } from '@algorandfoundation/xhd-wallet-api';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

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

async function deploy() {
  console.log('📦 Deploying RewardContract to TestNet...\n');

  const MNEMONIC = process.env.MNEMONIC || '';
  const BIP39_PASS = process.env.BIP39_PASS || '';
  const ACCOUNT = parseInt(process.env.ACCOUNT ?? '0', 10);
  const INDEX = parseInt(process.env.INDEX ?? '0', 10);
  const asaId = parseInt(process.env.ASA_ID || '0');

  if (!MNEMONIC) throw new Error('MNEMONIC not set');
  if (!asaId) throw new Error('ASA_ID not set');

  const m = normalize(MNEMONIC);
  const { addr, signTxn } = await derive24(m, {
    account: ACCOUNT,
    index: INDEX,
    passphrase: BIP39_PASS,
  });

  console.log(`Deploying from: ${addr}`);
  console.log(`ASA ID: ${asaId}\n`);

  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

  // Check balance
  const accountInfo = await algodClient.accountInformation(addr).do();
  const balance = accountInfo.amount / 1_000_000;
  console.log(`Account Balance: ${balance} ALGO`);

  if (balance < 0.2) {
    throw new Error('Insufficient balance. Need at least 0.2 ALGO');
  }

  // Read TEAL files
  const approvalProgram = fs.readFileSync('RewardContract.approval.teal', 'utf8');
  const clearProgram = fs.readFileSync('RewardContract.clear.teal', 'utf8');

  console.log('📝 Compiling TEAL to bytecode...');
  const approvalCompiled = await algodClient.compile(approvalProgram).do();
  const clearCompiled = await algodClient.compile(clearProgram).do();

  const params = await algodClient.getTransactionParams().do();

  // App args: validator, asaId, rewardAmount
  const appArgs = [
    algosdk.decodeAddress(addr).publicKey,
    algosdk.encodeUint64(asaId),
    algosdk.encodeUint64(100),
  ];

  console.log('🚀 Creating application...');
  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: addr,
    suggestedParams: params,
    approvalProgram: new Uint8Array(Buffer.from(approvalCompiled.result, 'base64')),
    clearProgram: new Uint8Array(Buffer.from(clearCompiled.result, 'base64')),
    numGlobalByteSlices: 1,
    numGlobalInts: 2,
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

  console.log(`\n✅ Contract Deployed!`);
  console.log(`   App ID: ${appId}`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   https://testnet.algoexplorer.io/application/${appId}\n`);

  // Update .env files
  let envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('SMART_CONTRACT_APP_ID=')) {
    envContent = envContent.replace(/SMART_CONTRACT_APP_ID=.*/, `SMART_CONTRACT_APP_ID=${appId}`);
  } else {
    envContent += `\nSMART_CONTRACT_APP_ID=${appId}`;
  }
  fs.writeFileSync('.env', envContent);

  const backendEnvPath = '../backend/.env';
  if (fs.existsSync(backendEnvPath)) {
    let backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
    if (backendEnv.includes('SMART_CONTRACT_APP_ID=')) {
      backendEnv = backendEnv.replace(/SMART_CONTRACT_APP_ID=.*/, `SMART_CONTRACT_APP_ID=${appId}`);
    } else {
      backendEnv += `\nSMART_CONTRACT_APP_ID=${appId}`;
    }
    fs.writeFileSync(backendEnvPath, backendEnv);
    console.log('💾 Updated backend/.env\n');
  }

  return appId;
}

deploy().catch((error) => {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
});
