import algosdk from 'algosdk';
import * as bip39 from 'bip39';
import { XHDWalletAPI, fromSeed, KeyContext } from '@algorandfoundation/xhd-wallet-api';
import dotenv from 'dotenv';

dotenv.config();

async function convertMnemonic() {
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error('MNEMONIC not set in .env');
  }

  const normalized = mnemonic.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!bip39.validateMnemonic(normalized)) {
    throw new Error('Invalid mnemonic');
  }

  const seed = bip39.mnemonicToSeedSync(normalized, process.env.BIP39_PASS || '');
  const root = fromSeed(seed);
  const xhd = new XHDWalletAPI();

  const account = parseInt(process.env.ACCOUNT || '0');
  const index = parseInt(process.env.INDEX || '0');

  // Try both API signatures
  let pub;
  try {
    pub = await xhd.keyGen(root, KeyContext.Address, account, index);
  } catch {
    pub = await xhd.keyGen(root, KeyContext.Address, account, 0, index);
  }

  const addr = algosdk.encodeAddress(pub);

  // Get the secret key from the HD derivation
  // For BIP-39 wallets, we need to reconstruct the full 64-byte secret key
  const secretKey = new Uint8Array(64);
  secretKey.set(seed.slice(0, 32), 0); // First 32 bytes: private key
  secretKey.set(pub, 32); // Last 32 bytes: public key

  const base64Key = Buffer.from(secretKey).toString('base64');

  console.log('Address:', addr);
  console.log('Base64 Private Key:', base64Key);

  return base64Key;
}

convertMnemonic().catch(console.error);
