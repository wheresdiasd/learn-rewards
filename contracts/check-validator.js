import algosdk from 'algosdk';

// Validator public key from smart contract
const validatorPubKeyBase64 = '6r/Poj1Wvodw4A+c39GLveeEolw+SXv27unnpPIW3/8=';
const validatorPubKey = Buffer.from(validatorPubKeyBase64, 'base64');
const validatorAddress = algosdk.encodeAddress(validatorPubKey);

console.log('Validator address in contract:', validatorAddress);

// Check what address our ORG_PRIVATE_KEY produces
const orgPrivateKey = 'vdy0RmS6Gs5oY7yYiextBFV/XoePi91Myo2/qT8VA9fqv8+iPVa+h3DgD5zf0Yu954SiXD5Je/bu6eek8hbf/w==';
const secretKey = new Uint8Array(Buffer.from(orgPrivateKey, 'base64'));
const accountAddress = algosdk.encodeAddress(secretKey.slice(32));

console.log('Address from ORG_PRIVATE_KEY:', accountAddress);
console.log('Match:', validatorAddress === accountAddress ? '✅ YES' : '❌ NO');
