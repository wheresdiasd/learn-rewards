import algosdk from 'algosdk';
import * as bip39 from 'bip39';
import { XHDWalletAPI, fromSeed, KeyContext } from '@algorandfoundation/xhd-wallet-api';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test the deployed smart contract
 * Verifies that rewards can be approved and paid correctly
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

  return { addr, signTxn };
}

async function testContract() {
  console.log('🧪 Testing Smart Contract...\n');

  const MNEMONIC = process.env.MNEMONIC || '';
  const BIP39_PASS = process.env.BIP39_PASS || '';
  const ACCOUNT = parseInt(process.env.ACCOUNT ?? '0', 10);
  const INDEX = parseInt(process.env.INDEX ?? '0', 10);
  const appId = parseInt(process.env.SMART_CONTRACT_APP_ID || '0');
  const asaId = parseInt(process.env.ASA_ID || '0');

  if (!MNEMONIC) throw new Error('MNEMONIC not set');
  if (!appId) throw new Error('SMART_CONTRACT_APP_ID not set. Run npm run deploy first');
  if (!asaId) throw new Error('ASA_ID not set');

  const m = normalize(MNEMONIC);
  const validator = await derive24(m, {
    account: ACCOUNT,
    index: INDEX,
    passphrase: BIP39_PASS,
  });

  const algodClient = new algosdk.Algodv2(
    process.env.ALGOD_TOKEN || '',
    process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud',
    ''
  );

  const contractAddress = algosdk.getApplicationAddress(appId);

  console.log('📋 Test Configuration:');
  console.log(`   Validator: ${validator.addr}`);
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   App ID: ${appId}`);
  console.log(`   ASA ID: ${asaId}\n`);

  // Check contract balance
  const contractInfo = await algodClient.accountInformation(contractAddress).do();
  const contractBalance = contractInfo.assets?.find((a: any) => a['asset-id'] === asaId)?.amount || 0;
  console.log(`Contract ASA Balance: ${contractBalance} tokens\n`);

  if (contractBalance < 100) {
    throw new Error('Contract has insufficient ASA balance. Run npm run fund first');
  }

  // Create a test learner account
  console.log('Test 1: Creating test learner account...');
  const learnerAccount = algosdk.generateAccount();
  console.log(`   Test learner address: ${learnerAccount.addr}`);

  // Opt learner into ASA (needed to receive tokens)
  console.log('   Opting learner into ASA...');

  // Fund learner with some ALGO for transaction fees
  const params = await algodClient.getTransactionParams().do();
  const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: validator.addr,
    to: learnerAccount.addr,
    amount: 200_000, // 0.2 ALGO for fees
    suggestedParams: params,
  });

  const signedFund = await validator.signTxn(fundTxn);
  await algodClient.sendRawTransaction(signedFund).do();
  await algosdk.waitForConfirmation(algodClient, fundTxn.txID(), 4);
  console.log('   ✅ Learner funded with ALGO');

  // Learner opts into ASA
  const params2 = await algodClient.getTransactionParams().do();
  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: learnerAccount.addr,
    to: learnerAccount.addr,
    amount: 0,
    assetIndex: asaId,
    suggestedParams: params2,
  });

  const signedOptIn = optInTxn.signTxn(learnerAccount.sk);
  await algodClient.sendRawTransaction(signedOptIn).do();
  await algosdk.waitForConfirmation(algodClient, optInTxn.txID(), 4);
  console.log('   ✅ Learner opted into ASA\n');

  // Test 2: Approve and pay learner via smart contract
  console.log('Test 2: Validator approves learner (should send 100 ASA)...');
  const params3 = await algodClient.getTransactionParams().do();

  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: validator.addr,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      new Uint8Array(Buffer.from('approveAndPay')),
      algosdk.decodeAddress(learnerAccount.addr).publicKey,
    ],
    suggestedParams: params3,
  });

  const signedAppCall = await validator.signTxn(appCallTxn);
  const { txId } = await algodClient.sendRawTransaction(signedAppCall).do();

  console.log(`   Transaction submitted: ${txId}`);
  console.log('   ⏳ Waiting for confirmation...');

  await algosdk.waitForConfirmation(algodClient, txId, 4);
  console.log('   ✅ Transaction confirmed!');
  console.log(`   View: https://testnet.algoexplorer.io/tx/${txId}\n`);

  // Verify learner received tokens
  console.log('Test 3: Verifying learner received tokens...');
  const learnerInfo = await algodClient.accountInformation(learnerAccount.addr).do();
  const learnerBalance = learnerInfo.assets?.find((a: any) => a['asset-id'] === asaId)?.amount || 0;

  console.log(`   Learner ASA balance: ${learnerBalance} tokens`);

  if (learnerBalance === 100) {
    console.log('   ✅ Learner received correct amount!\n');
  } else {
    throw new Error(`Expected learner to have 100 tokens, but has ${learnerBalance}`);
  }

  // Verify contract balance decreased
  const contractInfo2 = await algodClient.accountInformation(contractAddress).do();
  const newContractBalance = contractInfo2.assets?.find((a: any) => a['asset-id'] === asaId)?.amount || 0;

  console.log('Test 4: Verifying contract balance decreased...');
  console.log(`   Contract balance before: ${contractBalance}`);
  console.log(`   Contract balance after: ${newContractBalance}`);

  if (newContractBalance === contractBalance - 100) {
    console.log('   ✅ Contract balance decreased correctly!\n');
  } else {
    throw new Error('Contract balance did not decrease by expected amount');
  }

  console.log('✅ All Tests Passed!');
  console.log('\n🎉 Smart Contract is working correctly!');
  console.log('   Ready to integrate with backend\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testContract().catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
}

export { testContract };
