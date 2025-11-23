/**
 * Script para probar el incremento del contador manualmente
 * Ejecutar: node test-increment.js ARTISAN_ADDRESS CLIENT_SECRET
 */

import { Client } from './packages/artisan-registry-client/dist/index.js';
import * as StellarSDK from '@stellar/stellar-sdk';

const contractId = 'CCTN3PGFH6WT2T7IRNN543NGQV3TU2RZVDK5E4M4BAFPJGKKVIS46NPO';
const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = 'Test SDF Network ; September 2015';

const artisanAddress = process.argv[2];
const clientSecret = process.argv[3];

if (!artisanAddress || !clientSecret) {
  console.log('❌ Uso: node test-increment.js ARTISAN_ADDRESS CLIENT_SECRET');
  console.log('');
  console.log('Ejemplo:');
  console.log('  node test-increment.js GAESNY... SXXX...');
  process.exit(1);
}

async function testIncrement() {
  try {
    console.log('🧪 Testing payment counter increment...\n');

    // 1. Verificar cuenta del cliente
    console.log('1️⃣ Checking client account...');
    const clientKeypair = StellarSDK.Keypair.fromSecret(clientSecret);
    const clientPublicKey = clientKeypair.publicKey();
    console.log('   Client public key:', clientPublicKey);

    const horizonServer = new StellarSDK.Horizon.Server('https://horizon-testnet.stellar.org');

    try {
      const clientAccount = await horizonServer.loadAccount(clientPublicKey);
      const xlmBalance = clientAccount.balances.find(b => b.asset_type === 'native');
      console.log('   ✅ Balance:', xlmBalance.balance, 'XLM');

      if (parseFloat(xlmBalance.balance) < 5) {
        console.log('   ⚠️  WARNING: Low balance! Need at least 5 XLM for fees');
        console.log('   Fund with: https://friendbot.stellar.org?addr=' + clientPublicKey);
      }
    } catch (e) {
      console.log('   ❌ Account not found! Fund with Friendbot:');
      console.log('   https://friendbot.stellar.org?addr=' + clientPublicKey);
      process.exit(1);
    }

    // 2. Verificar que el artesano esté registrado
    console.log('\n2️⃣ Checking artisan registration...');
    const client = new Client({
      contractId,
      networkPassphrase,
      rpcUrl,
    });

    const isRegTx = await client.is_registered({ artisan_address: artisanAddress });
    const isRegResult = await isRegTx.simulate();

    if (!isRegResult.result) {
      console.log('   ❌ Artisan NOT registered on-chain');
      console.log('   Register first at: /register/artisan');
      process.exit(1);
    }
    console.log('   ✅ Artisan is registered');

    // 3. Obtener estado actual
    const artisanTx = await client.get_artisan({ artisan_address: artisanAddress });
    const artisanResult = await artisanTx.simulate();
    console.log('   Current payment count:', artisanResult.result.total_payments);

    // 4. Intentar incrementar
    console.log('\n3️⃣ Attempting to increment payment counter...');
    const incrementTx = await client.increment_payments({
      artisan_address: artisanAddress,
    });

    console.log('   📝 Signing transaction with client account...');
    const txXdr = incrementTx.toXDR();
    const transaction = StellarSDK.TransactionBuilder.fromXDR(txXdr, networkPassphrase);
    transaction.sign(clientKeypair);
    const signedXdr = transaction.toXDR();

    console.log('   📤 Sending transaction to Soroban RPC...');
    const rpcServer = new StellarSDK.rpc.Server(rpcUrl);
    const signedTransaction = StellarSDK.TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

    const sentTx = await rpcServer.sendTransaction(signedTransaction);
    console.log('   ✅ Transaction sent!');
    console.log('   Hash:', sentTx.hash);
    console.log('   Status:', sentTx.status);

    if (sentTx.status === 'ERROR') {
      console.log('   ❌ Transaction ERROR:', sentTx.errorResult);
      process.exit(1);
    }

    // 5. Esperar confirmación
    console.log('\n4️⃣ Waiting for confirmation...');
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const txResponse = await rpcServer.getTransaction(sentTx.hash);

        if (txResponse.status === 'SUCCESS') {
          console.log('   ✅ Transaction confirmed after', attempts + 1, 'seconds!');
          console.log('   View on Stellar Expert:');
          console.log('   https://stellar.expert/explorer/testnet/tx/' + sentTx.hash);

          // Verificar el nuevo contador
          console.log('\n5️⃣ Verifying new payment count...');
          const newArtisanTx = await client.get_artisan({ artisan_address: artisanAddress });
          const newArtisanResult = await newArtisanTx.simulate();
          console.log('   Previous count:', artisanResult.result.total_payments);
          console.log('   New count:', newArtisanResult.result.total_payments);

          if (newArtisanResult.result.total_payments > artisanResult.result.total_payments) {
            console.log('   ✅ SUCCESS! Counter incremented!');
          } else {
            console.log('   ⚠️  Counter did not increase');
          }

          return;
        } else if (txResponse.status === 'FAILED') {
          console.log('   ❌ Transaction FAILED');
          console.log('   Result:', txResponse);
          process.exit(1);
        }
      } catch (e) {
        // Still pending
        if (attempts % 10 === 0 && attempts > 0) {
          console.log('   ⏳ Still waiting... (' + attempts + 's elapsed)');
        }
      }

      attempts++;
    }

    console.log('   ⚠️  Timeout after 60 seconds');
    console.log('   Check manually: https://stellar.expert/explorer/testnet/tx/' + sentTx.hash);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testIncrement();
