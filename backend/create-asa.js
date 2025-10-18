// Node 18+; add { "type": "module" } to package.json

import algosdk from "algosdk";
import * as bip39 from "bip39";
import { XHDWalletAPI, fromSeed, KeyContext } from "@algorandfoundation/xhd-wallet-api";

// ---- env ----
// required: MNEMONIC (exact 24 words, BIP-39)
// optional: BIP39_PASS, ACCOUNT, INDEX, CREATE_ASA, TARGET_ADDR (sanity check)
const MNEMONIC   = process.env.MNEMONIC || "";
const BIP39_PASS = process.env.BIP39_PASS || "";
const ACCOUNT    = Number(process.env.ACCOUNT ?? 0);
const INDEX      = Number(process.env.INDEX ?? 0);
const CREATE_ASA = (process.env.CREATE_ASA || "false").toLowerCase() === "true";
const TARGET     = process.env.TARGET_ADDR || ""; // e.g. 5K747I...WCPNAEQ

// TestNet algod (Algonode public)
const ALGOD = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");

// ASA params (only used if CREATE_ASA=true)
const ASA = {
  name: "LearnToken",
  unit: "LEARN",
  decimals: 6,
  totalBaseUnits: 1_000_000_000_000n, // 1,000,000 tokens with 6 decimals
  defaultFrozen: false,
  url: "https://example.com/learn",
};

function normalize(m) {
  return m.trim().replace(/\s+/g, " ").toLowerCase();
}
async function signCompat(xhd, root, account, index, messageBytes) {
  // Long form: (account, change, index, message)
  try {
    const sig = await xhd.signAlgoTransaction(
      root, KeyContext.Address, account, 0, index, messageBytes
    );
    return sig; // Uint8Array
  } catch (e1) {
    // Short form: (account, index, message)
    try {
      const sig = await xhd.signAlgoTransaction(
        root, KeyContext.Address, account, index, messageBytes
      );
      return sig; // Uint8Array
    } catch (e2) {
      throw new Error(
        `signAlgoTransaction failed (both signatures). First: ${e1?.message || e1}. Second: ${e2?.message || e2}`
      );
    }
  }
}

// Try both xHD keyGen call shapes across versions:
//   A) keyGen(root, KeyContext.Address, account, index)
//   B) keyGen(root, KeyContext.Address, account, change, index)  with change=0
async function keyGenCompat(xhd, root, account, index) {
  try {
    const pkA = await xhd.keyGen(root, KeyContext.Address, account, index);
    return pkA;
  } catch {}
  const pkB = await xhd.keyGen(root, KeyContext.Address, account, 0, index);
  return pkB;
}

async function derive24(mnemonic, { account, index, passphrase }) {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid BIP-39 mnemonic (check spelling/order).");
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
  const root = fromSeed(seed);
  const xhd  = new XHDWalletAPI();

  const pub = await keyGenCompat(xhd, root, account, index);
  const addr = algosdk.encodeAddress(pub);

  
  async function signTxn(txn) {
    const bytes = txn.bytesToSign();                 // Uint8Array
    const sig = await signCompat(xhd, root, account, index, bytes);
    return txn.attachSignature(addr, sig);           // returns signed blob
  }

  return { addr, signTxn, path: `m/44'/283'/${account}'/0/${index}` };
}

async function main() {
  if (!MNEMONIC) {
    console.error("Set MNEMONIC='word1 ... word24' (and optional BIP39_PASS, ACCOUNT, INDEX).");
    process.exit(1);
  }
  const m = normalize(MNEMONIC);

  const { addr, signTxn, path } = await derive24(m, {
    account: ACCOUNT,
    index: INDEX,
    passphrase: BIP39_PASS,
  });

  console.log(`✅ Derived address: ${addr}`);
  console.log(`   Path:           ${path}`);

  if (TARGET) {
    if (addr !== TARGET) {
      console.error(`❌ Mismatch: derived ${addr} ≠ TARGET_ADDR ${TARGET}.
Check ACCOUNT/INDEX or BIP39_PASS. (We used a compat derivation call.)`);
      process.exit(2);
    } else {
      console.log("🔐 Sanity check: derived address matches TARGET_ADDR.");
    }
  }

  if (!CREATE_ASA) {
    console.log("Tip: set CREATE_ASA=true to create LearnToken (LEARN) on TestNet from this address.");
    return;
  }

  // --- create ASA (TestNet) ---
  const sp = await ALGOD.getTransactionParams().do();
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: addr,
    total: ASA.totalBaseUnits,
    decimals: ASA.decimals,
    defaultFrozen: ASA.defaultFrozen,
    unitName: ASA.unit,
    assetName: ASA.name,
    assetURL: ASA.url,
    manager: addr,
    reserve: addr,
    freeze: addr,
    clawback: addr,
    suggestedParams: sp,
  });

  const signed = await signTxn(txn);
  const { txId } = await ALGOD.sendRawTransaction(signed).do();
  const ptx = await algosdk.waitForConfirmation(ALGOD, txId, 20);

  console.log("🎉 ASA created on TestNet");
  console.log("   TxID:     ", txId);
  console.log("   Asset ID: ", ptx["asset-index"]);
  console.log("   Round:    ", ptx["confirmed-round"]);
}

main().catch((e) => {
  console.error("❌", e?.response?.text || e?.message || e);
  process.exit(1);
});