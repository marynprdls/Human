import { Horizon, Keypair, Networks } from '@stellar/stellar-sdk';
import { SocialAuthConfig, AuthMethod, AuthResult, PhoneVerification } from './types';
import { StellarSocialAccount } from './StellarSocialAccount';
import { GoogleAuthProvider } from './GoogleAuthProvider';
import { CryptoUtils } from './crypto';
import { DEFAULT_CONTRACT_ID } from './config';

export class StellarSocialSDK {
  private server: Horizon.Server;
  private contractId: string;
  private network: string;
  public googleProvider?: GoogleAuthProvider;

  constructor(config: SocialAuthConfig) {
    this.contractId = config.contractId || DEFAULT_CONTRACT_ID;
    this.network = config.network;
    this.server = new Horizon.Server(
      config.horizonUrl ||
      (config.network === 'testnet'
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org')
    );

    if (config.googleClientId) {
      this.googleProvider = new GoogleAuthProvider(config.googleClientId);
    }
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Stellar Social SDK...');
    if (this.googleProvider) {
      await this.googleProvider.initialize();
    }
    console.log('✅ SDK initialized');
  }

  async authenticateWithGoogleCredential(credentialResponse: any): Promise<AuthResult> {
    try {
      console.log('🔐 Processing Google credential response...');

      if (!this.googleProvider) {
        throw new Error('Google provider not configured. Please provide googleClientId in config.');
      }

      const authMethod = await this.googleProvider.createAuthMethodFromCredential(credentialResponse);

      const googleSub = authMethod.metadata?.sub;
      if (!googleSub) {
        throw new Error('Google user ID not found');
      }

      const keypair = CryptoUtils.generateKeypair('google', googleSub);
      const publicKey = keypair.publicKey();

      console.log(`🔑 Generated deterministic address for Google user: ${publicKey}`);
      console.log(`👤 Google user: ${authMethod.metadata?.name} (${authMethod.metadata?.email})`);

      const account = await this.getOrCreateAccountWithKeypair(keypair, authMethod);

      console.log('✅ Real Google authentication successful');
      return {
        success: true,
        account
      };
    } catch (error: any) {
      console.error('❌ Google authentication failed:', error.message);
      return {
        success: false,
        error: error.message || 'Google authentication failed'
      };
    }
  }

  private async getOrCreateAccountWithKeypair(
    keypair: Keypair,
    authMethod: AuthMethod
  ): Promise<StellarSocialAccount> {
    const publicKey = keypair.publicKey();

    try {
      await this.server.loadAccount(publicKey);
      console.log('📋 Loading existing account:', publicKey);

      const accountData = {
        publicKey,
        authMethods: [authMethod],
        createdAt: Date.now(),
        recoveryContacts: []
      };

      return new StellarSocialAccount(
        accountData,
        this.server,
        this.contractId,
        this.network,
        keypair
      );

    } catch (error) {
      console.log('🔨 Creating new account for Google user:', authMethod.metadata?.email);
      return await this.createNewAccountWithKeypair(keypair, authMethod);
    }
  }

  private async createNewAccountWithKeypair(
    keypair: Keypair,
    authMethod: AuthMethod
  ): Promise<StellarSocialAccount> {
    const publicKey = keypair.publicKey();

    if (this.network === 'testnet') {
      console.log('💰 Funding testnet account...');
      await this.fundTestnetAccount(publicKey);
      console.log('⏳ Waiting for account creation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const accountData = {
      publicKey,
      authMethods: [authMethod],
      createdAt: Date.now(),
      recoveryContacts: []
    };

    const account = new StellarSocialAccount(
      accountData,
      this.server,
      this.contractId,
      this.network,
      keypair
    );

    await account.initializeWithContract();
    return account;
  }

  private async fundTestnetAccount(publicKey: string): Promise<void> {
    if (this.network !== 'testnet') return;

    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (!response.ok) {
        throw new Error('Friendbot funding failed');
      }
      console.log('✅ Account funded with testnet XLM');
    } catch (error: any) {
      console.warn('⚠️ Friendbot funding failed:', error.message);
    }
  }
}

export * from './types';
export { StellarSocialAccount } from './StellarSocialAccount';
export { DEFAULT_CONTRACT_ID } from './config';
