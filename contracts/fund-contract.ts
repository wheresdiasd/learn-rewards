import algosdk from 'algosdk';
import * as bip39 from 'bip39';
import { XHDWalletAPI, fromSeed, KeyContext } from '@algorandfoundation/xhd-wallet-api';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fund the deployed smart contract with ASA tokens
 * This transfers ASA from your wallet to the contract so it can distribute rewards
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

async function fundContract() {
  console.log('💰 Funding Contract with ASA...\n');

  const MNEMONIC = process.env.MNEMONIC || '';
  const BIP39_PASS = process.env.BIP39_PASS || '';
  const ACCOUNT = parseInt(process.env.ACCOUNT ?? '0', 10);
  const INDEX = parseInt(process.env.INDEX ?? '0', 10);
  const appId = parseInt(process.env.SMART_CONTRACT_APP_ID || '0');
  const asaId = parseInt(process.env.ASA_ID || '0');

  if (!MNEMONIC) {
    throw new Error('MNEMONIC not set in .env');
  }
  if (!appId) {
    throw new Error('SMART_CONTRACT_APP_ID not set. Run "npm run deploy" first');
  }
  if (!asaId) {
    throw new Error('ASA_ID not set in .env');
  }

  const m = normalize(MNEMONIC);
  const { addr, signTxn } = await derive24(m, {
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

  console.log(`Your wallet: ${addr}`);
  console.log(`Contract address: ${contractAddress}`);
  console.log(`Contract App ID: ${appId}`);
  console.log(`ASA ID: ${asaId}\n`);

  // Check your current ASA balance
  const accountInfo = await algodClient.accountInformation(addr).do();
  const asaBalance = accountInfo.assets?.find((a: any) => a['asset-id'] === asaId)?.amount || 0;
  console.log(`Your ASA balance: ${asaBalance} tokens`);

  if (asaBalance === 0) {
    throw new Error(
      `You have no ASA tokens! Make sure ASA_ID=${asaId} is correct and you hold tokens.`
    );
  }

  const params = await algodClient.getTransactionParams().do();

  // Step 1: Contract opts into ASA
  console.log('\nStep 1: Contract opting into ASA...');
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
  console.log('   ✅ Contract opted into ASA');
  console.log(`   Tx: https://testnet.algoexplorer.io/tx/${optInTxId}\n`);

  // Step 2: Transfer ASA from your wallet to contract
  const amountToSend = 1000; // Send 1000 ASA tokens
  console.log(`Step 2: Transferring ${amountToSend} ASA to contract...`);

  const params2 = await algodClient.getTransactionParams().do();
  const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: addr,
    to: contractAddress,
    amount: amountToSend,
    assetIndex: asaId,
    suggestedParams: params2,
  });

  const signedTransfer = await signTxn(transferTxn);
  const { txId: transferTxId } = await algodClient.sendRawTransaction(signedTransfer).do();
  await algosdk.waitForConfirmation(algodClient, transferTxId, 4);

  console.log(`   ✅ Transferred ${amountToSend} ASA to contract`);
  console.log(`   Tx: https://testnet.algoexplorer.io/tx/${transferTxId}\n`);

  // Verify contract balance
  const contractInfo = await algodClient.accountInformation(contractAddress).do();
  const contractBalance = contractInfo.assets?.find((a: any) => a['asset-id'] === asaId)?.amount || 0;

  console.log('✅ Contract Funded Successfully!');
  console.log(`   Contract ASA balance: ${contractBalance} tokens`);
  console.log(`   Can distribute ${Math.floor(contractBalance / 100)} rewards (100 tokens each)\n`);

  console.log('🎉 Smart Contract is ready!');
  console.log('   Next: Update backend to use the contract for approvals\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fundContract().catch((error) => {
    console.error('\n❌ Funding failed:', error.message);
    process.exit(1);
  });
}

export { fundContract };
