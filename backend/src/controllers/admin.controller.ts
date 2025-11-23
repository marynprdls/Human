import { Request, Response } from 'express';
import * as StellarSDK from '@stellar/stellar-sdk';
import { Client } from '../../../packages/artisan-registry-client/dist/index.js';

const contractId = process.env.ARTISAN_REGISTRY_CONTRACT_ID || 'CBDR2PI4GGACYQNLHW4IKYGNCGXRNFOCGGWOEGIJBUIIKDN4QUA6H4MD';
const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = 'Test SDF Network ; September 2015';

// Admin secret key - SOLO PARA DESARROLLO/TESTING
// En producción esto debe estar en variables de entorno
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || '';

export class AdminController {
  /**
   * POST /api/admin/verify-artisan
   * Verificar un artesano usando la cuenta admin del contrato
   */
  async verifyArtisan(req: Request, res: Response): Promise<void> {
    try {
      const { artisan_address, admin_password } = req.body;

      console.log('🔐 Admin verification request for:', artisan_address);

      // Simple password protection
      if (admin_password !== 'stellar2024') {
        res.status(401).json({ error: 'Invalid admin password' });
        return;
      }

      if (!artisan_address) {
        res.status(400).json({ error: 'artisan_address is required' });
        return;
      }

      if (!ADMIN_SECRET) {
        res.status(500).json({ error: 'Admin secret key not configured' });
        return;
      }

      // Create admin keypair from secret
      const adminKeypair = StellarSDK.Keypair.fromSecret(ADMIN_SECRET);
      console.log('✅ Using admin account:', adminKeypair.publicKey());

      // Create contract client
      const client = new Client({
        contractId,
        networkPassphrase,
        rpcUrl,
        publicKey: adminKeypair.publicKey(),
      });

      // Build verify transaction
      console.log('🔧 Building transaction...');
      const tx = await client.verify_artisan({
        admin: adminKeypair.publicKey(),
        artisan_address: artisan_address,
      });

      console.log('✍️ Signing transaction...');
      // Sign with admin keypair
      const signedXdr = tx.toXDR();
      const txBuilder = StellarSDK.TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      txBuilder.sign(adminKeypair);
      const signedTransaction = txBuilder.toXDR();

      console.log('📡 Sending transaction to network...');
      // Send to network
      const server = new StellarSDK.rpc.Server(rpcUrl);

      try {
        const sentTx = await server.sendTransaction(
          StellarSDK.TransactionBuilder.fromXDR(signedTransaction, networkPassphrase)
        );

        console.log('📤 Transaction sent:', sentTx.hash);
        console.log('📊 Transaction status:', sentTx.status);

        if (sentTx.status === 'ERROR') {
          console.error('❌ Transaction rejected by network:', JSON.stringify(sentTx, null, 2));
          res.status(400).json({
            success: false,
            error: 'Transaction rejected by network',
            details: sentTx
          });
          return;
        }

        // Wait for confirmation (60 seconds max)
        console.log('⏳ Waiting for transaction confirmation...');
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
          try {
            const txResponse = await server.getTransaction(sentTx.hash);

            if (txResponse.status === 'SUCCESS') {
              console.log(`✅ Artisan verified successfully! (confirmed after ${attempts + 1}s)`);
              res.json({
                success: true,
                txHash: sentTx.hash,
                message: 'Artisan verified on-chain'
              });
              return;
            } else if (txResponse.status === 'FAILED') {
              console.error('❌ Transaction failed on-chain');
              res.status(400).json({
                success: false,
                error: 'Transaction failed on-chain'
              });
              return;
            }
          } catch (e) {
            // Transaction not yet available
            if (attempts % 10 === 0 && attempts > 0) {
              console.log(`⏳ Still waiting... (${attempts}s elapsed)`);
            }
          }

          // Wait 1 second before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        // Timeout
        res.status(408).json({
          success: false,
          error: 'Transaction timeout - check Stellar Explorer',
          txHash: sentTx.hash
        });
      } catch (sendError: any) {
        console.error('❌ Error sending transaction:', sendError);
        console.error('❌ Error details:', JSON.stringify(sendError, null, 2));
        res.status(500).json({
          success: false,
          error: 'Failed to send transaction',
          details: sendError.message || sendError.toString()
        });
        return;
      }

    } catch (error: any) {
      console.error('❌ Error verifying artisan:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * GET /api/admin/check/:stellar_address
   * Verificar si un artesano está registrado y su estado
   */
  async checkArtisan(req: Request, res: Response): Promise<void> {
    try {
      const { stellar_address } = req.params;

      const client = new Client({
        contractId,
        networkPassphrase,
        rpcUrl,
      });

      // Check if registered
      const isRegTx = await client.is_registered({ artisan_address: stellar_address });
      const isRegResult = await isRegTx.simulate();

      if (!isRegResult.result) {
        res.json({
          registered: false,
          verified: false,
          message: 'Artisan not registered on-chain'
        });
        return;
      }

      // Get artisan data
      const artisanTx = await client.get_artisan({ artisan_address: stellar_address });
      const artisanResult = await artisanTx.simulate();

      if (artisanResult.result) {
        res.json({
          registered: true,
          verified: artisanResult.result.verified,
          name: artisanResult.result.name,
          total_payments: artisanResult.result.total_payments,
          registered_at: Number(artisanResult.result.registered_at),
          stellar_address: artisanResult.result.stellar_address
        });
      } else {
        res.status(404).json({ error: 'Artisan data not found' });
      }

    } catch (error: any) {
      console.error('❌ Error checking artisan:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AdminController();

