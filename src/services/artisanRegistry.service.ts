import { Client, networks, Artisan } from 'artisan-registry-client';
import { rpc, TransactionBuilder } from '@stellar/stellar-sdk';
import { logger } from '../utils/logger';

const contractId = import.meta.env.PUBLIC_ARTISAN_REGISTRY_CONTRACT_ID;
const rpcUrl = import.meta.env.PUBLIC_STELLAR_RPC_URL;
const networkPassphrase = import.meta.env.PUBLIC_STELLAR_NETWORK_PASSPHRASE;

if (!contractId) {
  logger.error('❌ PUBLIC_ARTISAN_REGISTRY_CONTRACT_ID not configured in .env');
}

/**
 * Servicio FRONTEND para interactuar con el contrato ArtisanRegistry
 * Usado para transacciones que requieren firma del usuario
 */
class ArtisanRegistryService {
  private getClient(publicKey?: string) {
    return new Client({
      contractId,
      networkPassphrase,
      rpcUrl,
      publicKey,
    });
  }

  /**
   * Registrar un artesano en el contrato
   * Requiere firma del artesano
   */
  async registerArtisan(
    artisanAddress: string,
    name: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.log('📝 Registering artisan on-chain:', { artisanAddress, name });

      const client = this.getClient(artisanAddress);

      // Construir la transacción
      const tx = await client.register_artisan({
        artisan_address: artisanAddress,
        name: name,
      });

      // Firmar la transacción con la wallet del usuario
      const signedXdr = await signTransaction(tx.toXDR());

      // Enviar la transacción firmada
      const rpcServer = new rpc.Server(rpcUrl);
      const transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const sentTx = await rpcServer.sendTransaction(transaction);

      logger.log('✅ Artisan registered on-chain:', sentTx);

      return { success: true };
    } catch (error: any) {
      logger.error('❌ Error registering artisan:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar si un artesano está registrado (consulta de solo lectura)
   */
  async isRegistered(artisanAddress: string): Promise<boolean> {
    try {
      const client = this.getClient();

      const tx = await client.is_registered({ artisan_address: artisanAddress });
      const result = await tx.simulate();

      return result.result || false;
    } catch (error) {
      logger.error('Error checking registration:', error);
      return false;
    }
  }

  /**
   * Verificar si un artesano está verificado (consulta de solo lectura)
   */
  async isVerified(artisanAddress: string): Promise<boolean> {
    try {
      const client = this.getClient();

      const tx = await client.is_verified({ artisan_address: artisanAddress });
      const result = await tx.simulate();

      return result.result || false;
    } catch (error) {
      logger.error('Error checking verification:', error);
      return false;
    }
  }

  /**
   * Obtener información de un artesano (consulta de solo lectura)
   */
  async getArtisan(artisanAddress: string): Promise<Artisan | null> {
    try {
      const client = this.getClient();

      const tx = await client.get_artisan({ artisan_address: artisanAddress });
      const result = await tx.simulate();

      return result.result || null;
    } catch (error) {
      logger.error('Error getting artisan:', error);
      return null;
    }
  }

  /**
   * Verificar un artesano (solo admin, requiere firma)
   */
  async verifyArtisan(
    adminAddress: string,
    artisanAddress: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.log('✅ Verifying artisan on-chain:', { adminAddress, artisanAddress });

      const client = this.getClient(adminAddress);

      const tx = await client.verify_artisan({
        admin: adminAddress,
        artisan_address: artisanAddress,
      });

      const signedXdr = await signTransaction(tx.toXDR());

      const rpcServer = new rpc.Server(rpcUrl);
      const transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const sentTx = await rpcServer.sendTransaction(transaction);

      logger.log('✅ Artisan verified on-chain:', sentTx);

      return { success: true };
    } catch (error: any) {
      logger.error('❌ Error verifying artisan:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Incrementar contador de pagos de un artesano
   * Se llama automáticamente cuando se verifica un pago
   */
  async incrementPayments(
    artisanAddress: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      logger.log('📊 Incrementing payment counter for:', artisanAddress);

      const client = this.getClient();

      const tx = await client.increment_payments({
        artisan_address: artisanAddress,
      });

      logger.log('📝 Signing transaction...');
      const signedXdr = await signTransaction(tx.toXDR());

      logger.log('📤 Sending transaction...');
      const rpcServer = new rpc.Server(rpcUrl);
      const transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const sentTx = await rpcServer.sendTransaction(transaction);

      logger.log('⏳ Waiting for confirmation... Hash:', sentTx.hash);

      // Esperar confirmación de la transacción
      let attempts = 0;
      const maxAttempts = 60; // 60 segundos máximo (testnet puede ser lenta)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const txResponse = await rpcServer.getTransaction(sentTx.hash);

          if (txResponse.status === 'SUCCESS') {
            logger.log('✅ Payment counter incremented successfully!');
            logger.log('   Confirmed after', attempts + 1, 'seconds');
            return { success: true, txHash: sentTx.hash };
          } else if (txResponse.status === 'FAILED') {
            logger.error('❌ Transaction failed');
            return { success: false, error: 'Transaction failed' };
          }
        } catch (e) {
          // Todavía no está disponible, seguir esperando
          if (attempts % 10 === 0) {
            logger.log(`⏳ Still waiting... (${attempts}s elapsed)`);
          }
        }

        attempts++;
      }

      // Si llegamos aquí, timeout - pero la transacción puede confirmarse después
      logger.warn('⚠️  Transaction timeout after 60s, but it may still succeed');
      logger.warn('   Check Stellar Expert: https://stellar.expert/explorer/testnet/tx/' + sentTx.hash);
      return { success: true, txHash: sentTx.hash }; // Asumimos éxito
    } catch (error: any) {
      logger.error('❌ Error incrementing payments:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener la dirección del admin del contrato (consulta de solo lectura)
   */
  async getAdmin(): Promise<string | null> {
    try {
      const client = this.getClient();

      const tx = await client.get_admin();
      const result = await tx.simulate();

      return result.result || null;
    } catch (error) {
      logger.error('Error getting admin:', error);
      return null;
    }
  }
}

export default new ArtisanRegistryService();
