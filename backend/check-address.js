// Node 18+; add { "type": "module" } to package.json
import algosdk from "algosdk";
import * as bip39 from "bip39";
import { XHDWalletAPI, fromSeed, KeyContext } from "@algorandfoundation/xhd-wallet-api";

// --- env ---
// MNEMONIC: your 24 words (BIP-39, Pera Universal)
// BIP39_PASS: optional passphrase (aka "25th word") if you set one
// ACCOUNT: HD account (default 0)
// INDEX:   HD address index (default 0)
// Or provide TARGET_ADDR to scan for a specific address (recommended)
const MNEMONIC   = process.env.MNEMONIC || "";
const BIP39_PASS = process.env.BIP39_PASS || "";
const ACCOUNT    = parseInt(process.env.ACCOUNT ?? "0", 10);
const INDEX      = parseInt(process.env.INDEX ?? "0", 10);
const TARGET     = process.env.TARGET_ADDR || "";

// scan ranges (used only if TARGET_ADDR is set)
const MAX_ACCOUNTS = parseInt(process.env.MAX_ACCOUNTS ?? "6", 10);
const MAX_INDEX    = parseInt(process.env.MAX_INDEX ?? "50", 10);

// TestNet algod (Algonode)
const ALGOD = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");

function normalize(m) {
  return m.trim().replace(/\s+/g, " ").toLowerCase();
}

async function keyGenCompat(api, root, account, index) {
  // Some builds use (account, index), others (account, change, index)
  try {
    const pkA = await api.keyGen(root, KeyContext.Address, account, index);
    return pkA;
  } catch {}
  const pkB = await api.keyGen(root, KeyContext.Address, account, 0, index);
  return pkB;
}

async function deriveAddr(mnemonic, account, index) {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid BIP-39 mnemonic (check order/spelling).");
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic, BIP39_PASS);
  const root = fromSeed(seed);
  const xhd  = new XHDWalletAPI();
  const pub  = await keyGenCompat(xhd, root, account, index);
  const addr = algosdk.encodeAddress(pub);
  return { addr, path: `m/44'/283'/${account}'/0/${index}` };
}

async function checkRekeyTestnet(addr) {
  try {
    const info = await ALGOD.accountInformation(addr).do();
    return info["auth-addr"] || null;
  } catch {
    return null;
  }
}

(async () => {
  if (!MNEMONIC) {
    console.error("Set MNEMONIC='word1 ... word24' (and optional BIP39_PASS).");
    process.exit(1);
  }

  const m = normalize(MNEMONIC);

  // If user provided TARGET_ADDR, scan to find its path on TestNet
  if (TARGET) {
    if (!algosdk.isValidAddress(TARGET)) {
      console.error("TARGET_ADDR isn’t a valid Algorand address.");
      process.exit(1);
    }
    console.log(`🔎 Looking for ${TARGET} on TestNet (account'/0/index)...`);
    for (let a = 0; a < MAX_ACCOUNTS; a++) {
      for (let i = 0; i < MAX_INDEX; i++) {
        const { addr, path } = await deriveAddr(m, a, i);
        if (addr === TARGET) {
          console.log(`✅ Match: ${addr}  @  ${path}`);
          const auth = await checkRekeyTestnet(addr);
          if (auth && auth !== addr) {
            console.log(`ℹ️  Rekeyed: auth-addr = ${auth} (you must sign with that key).`);
          }
          process.exit(0);
        }
      }
    }
    console.log("No match in scanned range. Try increasing MAX_ACCOUNTS/MAX_INDEX or set BIP39_PASS.");
    const auth = await checkRekeyTestnet(TARGET);
    if (auth && auth !== TARGET) {
      console.log(`⚠️ Address is rekeyed. auth-addr = ${auth} (derive/sign that address).`);
    }
    process.exit(2);
  }

  // Otherwise, just derive a single address at ACCOUNT/INDEX
  const { addr, path } = await deriveAddr(m, ACCOUNT, INDEX);
  console.log(`✅ Address: ${addr}`);
  console.log(`   Path:   ${path}`);

  const auth = await checkRekeyTestnet(addr);
  if (auth && auth !== addr) {
    console.log(`ℹ️  Rekeyed on TestNet: auth-addr = ${auth} (derive/sign with that key).`);
  }
})().catch((e) => {
  console.error("Error:", e.message || e);
  process.exit(1);
});