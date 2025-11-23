import { Client, Artisan } from 'artisan-registry-client';
import * as dotenv from 'dotenv';

dotenv.config();

const contractId = process.env.PUBLIC_ARTISAN_REGISTRY_CONTRACT_ID;
const rpcUrl = process.env.PUBLIC_STELLAR_RPC_URL;
const networkPassphrase = process.env.PUBLIC_STELLAR_NETWORK_PASSPHRASE;

if (!contractId) {
  console.error('❌ PUBLIC_ARTISAN_REGISTRY_CONTRACT_ID not configured');
}

/**
 * Servicio BACKEND para consultas de solo lectura al contrato ArtisanRegistry
 * No puede firmar transacciones (sin private keys en backend por seguridad)
 */
class ArtisanRegistryService {
  private getClient() {
    return new Client({
      contractId: contractId!,
      networkPassphrase: networkPassphrase!,
      rpcUrl: rpcUrl!,
      publicKey: undefined,
    });
  }

  /**
   * Verificar si un artesano está registrado en el contrato
   */
  async isRegistered(artisanAddress: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if artisan is registered on-chain:', artisanAddress);

      const client = this.getClient();
      const tx = await client.is_registered({ artisan_address: artisanAddress });
      const result = await tx.simulate();

      const isRegistered = result.result || false;
      console.log(isRegistered ? '✅ Artisan is registered' : '❌ Artisan not registered');

      return isRegistered;
    } catch (error) {
      console.error('❌ Error checking registration:', error);
      return false;
    }
  }

  /**
   * Verificar si un artesano está verificado
   */
  async isVerified(artisanAddress: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if artisan is verified on-chain:', artisanAddress);

      const client = this.getClient();
      const tx = await client.is_verified({ artisan_address: artisanAddress });
      const result = await tx.simulate();

      const isVerified = result.result || false;
      console.log(isVerified ? '✅ Artisan is verified' : '⚠️  Artisan not verified');

      return isVerified;
    } catch (error) {
      console.error('❌ Error checking verification:', error);
      return false;
    }
  }

  /**
   * Obtener información completa de un artesano desde el contrato
   */
  async getArtisan(artisanAddress: string): Promise<Artisan | null> {
    try {
      console.log('📋 Getting artisan data from contract:', artisanAddress);

      const client = this.getClient();
      const tx = await client.get_artisan({ artisan_address: artisanAddress });
      const result = await tx.simulate();

      const artisan = result.result || null;

      if (artisan) {
        console.log('✅ Artisan data:', {
          name: artisan.name,
          verified: artisan.verified,
          total_payments: artisan.total_payments,
          registered_at: new Date(Number(artisan.registered_at) * 1000).toISOString()
        });
      } else {
        console.log('❌ Artisan not found in contract');
      }

      return artisan;
    } catch (error) {
      console.error('❌ Error getting artisan:', error);
      return null;
    }
  }

  /**
   * Obtener la dirección del admin del contrato
   */
  async getAdmin(): Promise<string | null> {
    try {
      const client = this.getClient();
      const tx = await client.get_admin();
      const result = await tx.simulate();

      const admin = result.result || null;
      console.log('🔑 Contract admin:', admin);

      return admin;
    } catch (error) {
      console.error('❌ Error getting admin:', error);
      return null;
    }
  }

  /**
   * Verificar si una dirección es el admin del contrato
   */
  async isAdmin(address: string): Promise<boolean> {
    try {
      const admin = await this.getAdmin();
      return admin === address;
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      return false;
    }
  }
}

export default new ArtisanRegistryService();
