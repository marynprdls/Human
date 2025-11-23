// Script para verificar el estado del contrato
import { Client } from './packages/artisan-registry-client/dist/index.js';
import { rpc } from '@stellar/stellar-sdk';

const contractId = 'CCTN3PGFH6WT2T7IRNN543NGQV3TU2RZVDK5E4M4BAFPJGKKVIS46NPO';
const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = 'Test SDF Network ; September 2015';

async function checkContract() {
  console.log('🔍 Verificando estado del contrato...\n');

  const client = new Client({
    contractId,
    networkPassphrase,
    rpcUrl,
  });

  try {
    // 1. Obtener Admin
    console.log('1️⃣ Obteniendo cuenta admin del contrato...');
    const adminTx = await client.get_admin();
    const adminResult = await adminTx.simulate();
    console.log('✅ Admin del contrato:', adminResult.result);
    console.log('');

    // 2. Verificar si una dirección está registrada
    const testAddress = process.argv[2];
    if (testAddress) {
      console.log('2️⃣ Verificando artesano:', testAddress);

      const isRegTx = await client.is_registered({ artisan_address: testAddress });
      const isRegResult = await isRegTx.simulate();
      console.log('   Registrado:', isRegResult.result);

      if (isRegResult.result) {
        const artisanTx = await client.get_artisan({ artisan_address: testAddress });
        const artisanResult = await artisanTx.simulate();

        if (artisanResult.result) {
          console.log('   Nombre:', artisanResult.result.name);
          console.log('   Verificado:', artisanResult.result.verified);
          console.log('   Total Pagos:', artisanResult.result.total_payments);
          const regDate = new Date(Number(artisanResult.result.registered_at) * 1000);
          console.log('   Fecha registro:', regDate.toLocaleString('es-ES'));
        }
      }
    } else {
      console.log('💡 Usa: node check-contract.js DIRECCION_STELLAR');
      console.log('   Para verificar un artesano específico');
    }

    console.log('');
    console.log('🎯 Resumen:');
    console.log('   Para acceder al panel de admin, debes hacer login con la cuenta:');
    console.log('   ' + adminResult.result);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkContract();
