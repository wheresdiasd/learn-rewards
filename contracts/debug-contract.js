import algosdk from 'algosdk';

// Config from environment (you'll need to export these)
const APP_ID = parseInt(process.env.SMART_CONTRACT_APP_ID || '747977225');
const ASA_ID = parseInt(process.env.ASA_ID || '747968880');
const ALGOD_URL = process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud';

const algodClient = new algosdk.Algodv2('', ALGOD_URL, '');

async function debugContract() {
  console.log('🔍 Debugging Smart Contract\n');
  console.log('App ID:', APP_ID);
  console.log('ASA ID:', ASA_ID);
  console.log('\n---\n');

  // Get application info
  const appInfo = await algodClient.getApplicationByID(APP_ID).do();
  const appAddress = algosdk.getApplicationAddress(APP_ID);

  console.log('📍 Contract Address:', appAddress);
  console.log('\n📊 Global State:');

  // Decode global state
  for (const item of appInfo.params['global-state']) {
    const key = Buffer.from(item.key, 'base64').toString();
    let value;

    if (item.value.type === 1) {
      // bytes
      value = Buffer.from(item.value.bytes, 'base64');
      if (key === 'validator') {
        value = algosdk.encodeAddress(value);
      }
    } else {
      // uint
      value = item.value.uint;
    }

    console.log(`  ${key}:`, value);
  }

  // Check account info (balance and opted ASAs)
  console.log('\n💰 Contract Account Info:');
  const accountInfo = await algodClient.accountInformation(appAddress).do();
  console.log('  ALGO Balance:', accountInfo.amount / 1_000_000, 'ALGO');

  console.log('\n🪙 Assets:');
  if (accountInfo.assets && accountInfo.assets.length > 0) {
    for (const asset of accountInfo.assets) {
      const assetInfo = await algodClient.getAssetByID(asset['asset-id']).do();
      console.log(`  Asset ${asset['asset-id']} (${assetInfo.params.name}):`);
      console.log(`    Balance: ${asset.amount}`);
      console.log(`    Opted in: ✅`);

      if (asset['asset-id'] === ASA_ID) {
        console.log(`    👉 This is the reward ASA!`);
        if (asset.amount === 0) {
          console.log('    ⚠️  WARNING: Balance is 0! Fund the contract with ASA tokens.');
        }
      }
    }
  } else {
    console.log('  ⚠️  No assets opted in!');
    console.log(`  You need to call optInToAsa() first.`);
  }
}

debugContract().catch(console.error);
