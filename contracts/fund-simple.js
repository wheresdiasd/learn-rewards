import algosdk from 'algosdk';
import * as bip39 from 'bip39';
import { XHDWalletAPI, fromSeed, KeyContext } from '@algorandfoundation/xhd-wallet-api';
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

async function fundContract() {
  console.log('💰 Funding Contract with ASA...\n');

  const MNEMONIC = process.env.MNEMONIC || '';
  const BIP39_PASS = process.env.BIP39_PASS || '';
  const ACCOUNT = parseInt(process.env.ACCOUNT ?? '0', 10);
  const INDEX = parseInt(process.env.INDEX ?? '0', 10);
  const appId = parseInt(process.env.SMART_CONTRACT_APP_ID || '0');
  const asaId = parseInt(process.env.ASA_ID || '0');

  if (!MNEMONIC) throw new Error('MNEMONIC not set');
  if (!appId) throw new Error('SMART_CONTRACT_APP_ID not set');
  if (!asaId) throw new Error('ASA_ID not set');

  const m = normalize(MNEMONIC);
  const { addr, signTxn } = await derive24(m, {
    account: ACCOUNT,
    index: INDEX,
    passphrase: BIP39_PASS,
  });

  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
  const contractAddress = algosdk.getApplicationAddress(appId);

  console.log(`Your wallet: ${addr}`);
  console.log(`Contract address: ${contractAddress}`);
  console.log(`App ID: ${appId}`);
  console.log(`ASA ID: ${asaId}\n`);

  // Check ASA balance
  const accountInfo = await algodClient.accountInformation(addr).do();
  const asaBalance = accountInfo.assets?.find((a) => a['asset-id'] === asaId)?.amount || 0;
  console.log(`Your ASA balance: ${asaBalance} tokens\n`);

  if (asaBalance === 0) {
    throw new Error('You have no ASA tokens!');
  }

  // Step 1: Fund contract with ALGO for transaction fees
  console.log('Step 1: Funding contract with ALGO for fees...');
  let params = await algodClient.getTransactionParams().do();

  const fundAlgoTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: addr,
    to: contractAddress,
    amount: 500_000, // 0.5 ALGO (min balance + fees)
    suggestedParams: params,
  });

  const signedFundAlgo = await signTxn(fundAlgoTxn);
  await algodClient.sendRawTransaction(signedFundAlgo).do();
  await algosdk.waitForConfirmation(algodClient, fundAlgoTxn.txID(), 4);
  console.log('   ✅ Contract funded with 0.5 ALGO\n');

  // Step 2: Contract opts into ASA
  console.log('Step 2: Contract opting into ASA...');
  params = await algodClient.getTransactionParams().do();

  const optInTxn = algosdk.makeApplicationCallTxnFromObject({
    from: addr,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [new Uint8Array(Buffer.from('optInToAsa'))],
    foreignAssets: [asaId],
    suggestedParams: params,
  });

  const signedOptIn = await signTxn(optInTxn);
  const { txId: optInTxId } = await algodClient.sendRawTransaction(signedOptIn).do();
  await algosdk.waitForConfirmation(algodClient, optInTxId, 4);
  console.log('   ✅ Contract opted into ASA\n');

  // Step 3: Transfer ASA to contract
  const amountToSend = 1000;
  console.log(`Step 3: Transferring ${amountToSend} ASA to contract...`);

  params = await algodClient.getTransactionParams().do();
  const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: addr,
    to: contractAddress,
    amount: amountToSend,
    assetIndex: asaId,
    suggestedParams: params,
  });

  const signedTransfer = await signTxn(transferTxn);
  const { txId: transferTxId } = await algodClient.sendRawTransaction(signedTransfer).do();
  await algosdk.waitForConfirmation(algodClient, transferTxId, 4);

  console.log(`   ✅ Transferred ${amountToSend} ASA`);
  console.log(`   Tx: https://testnet.algoexplorer.io/tx/${transferTxId}\n`);

  // Verify
  const contractInfo = await algodClient.accountInformation(contractAddress).do();
  const contractBalance = contractInfo.assets?.find((a) => a['asset-id'] === asaId)?.amount || 0;

  console.log('✅ Contract Funded!');
  console.log(`   Contract ASA balance: ${contractBalance} tokens`);
  console.log(`   Can distribute ${Math.floor(contractBalance / 100)} rewards\n`);
}

fundContract().catch((error) => {
  console.error('\n❌ Funding failed:', error.message);
  process.exit(1);
});
