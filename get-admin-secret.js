// Script para obtener la secret key desde seed phrase
import * as StellarSDK from '@stellar/stellar-sdk';
import { mnemonicToSeed } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

const seedPhrase = "obey lonely reject act dolphin blade quiz wet churn add soda topple tackle super dentist frown battle inner rain story release pretty boat again";

async function getSecretKey() {
  // Convert mnemonic to seed
  const seed = await mnemonicToSeed(seedPhrase);

  // Derive keypair using BIP-44 path (Stellar's standard)
  const path = "m/44'/148'/0'";
  const derivedSeed = derivePath(path, seed.toString('hex')).key;

  // Create Stellar keypair
  const keypair = StellarSDK.Keypair.fromRawEd25519Seed(Buffer.from(derivedSeed));

  console.log('🔑 Admin Account Details:');
  console.log('Public Key:', keypair.publicKey());
  console.log('Secret Key:', keypair.secret());
  console.log('');
  console.log('✅ Add this to backend/.env:');
  console.log(`ADMIN_SECRET_KEY=${keypair.secret()}`);
}

getSecretKey();
