import * as StellarSDK from '@stellar/stellar-sdk';

export const STELLAR_CONFIG = {
  NETWORK: 'testnet',
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
  NETWORK_PASSPHRASE: StellarSDK.Networks.TESTNET
};

export const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
export const USDC_ASSET = new StellarSDK.Asset('USDC', USDC_ISSUER);

export const server = new StellarSDK.Horizon.Server(STELLAR_CONFIG.HORIZON_URL);

export async function testConnection(): Promise<boolean> {
  try {
    const ledger = await server.ledgers().order('desc').limit(1).call();
    console.log('Stellar connected, ledger:', ledger.records[0].sequence);
    return true;
  } catch (error) {
    console.error(' Stellar connection failed:', error);
    return false;
  }
}
