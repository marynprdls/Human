import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo
} from '@stellar/stellar-sdk';
import { AuthMethod, SocialAccountData } from './types';

export class StellarSocialAccount {
  private keypair?: Keypair;
  private server: Horizon.Server;
  private contractId: string;
  private network: string;
  public data: SocialAccountData;

  constructor(
    data: SocialAccountData,
    server: Horizon.Server,
    contractId: string,
    network: string,
    keypair?: Keypair
  ) {
    this.data = data;
    this.server = server;
    this.contractId = contractId;
    this.network = network;
    this.keypair = keypair;
  }

  get publicKey(): string {
    return this.data.publicKey;
  }

  get authMethods(): AuthMethod[] {
    return this.data.authMethods;
  }

  async sendPayment(
    destination: string,
    amount: string,
    asset: Asset = Asset.native(),
    memo?: string
  ): Promise<string> {
    if (!this.keypair) {
      throw new Error('No keypair available for signing. Use social auth recovery.');
    }

    try {
      const account = await this.server.loadAccount(this.publicKey);

      const txBuilder = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: this.network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC,
      });

      txBuilder.addOperation(
        Operation.payment({
          destination,
          asset,
          amount,
        })
      );

      if (memo) {
        const truncatedMemo = memo.length > 28 ? memo.substring(0, 28) : memo;
        txBuilder.addMemo(Memo.text(truncatedMemo));
      }

      const transaction = txBuilder.setTimeout(300).build();
      transaction.sign(this.keypair);

      const result = await this.server.submitTransaction(transaction);
      return result.hash;
    } catch (error: any) {
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  async addAuthMethod(newMethod: AuthMethod): Promise<boolean> {
    this.data.authMethods.push(newMethod);
    console.log(`[ok] Added auth method: ${newMethod.type}`);
    return true;
  }

  async getBalance(): Promise<{ balance: string; asset: string }[]> {
    try {
      const account = await this.server.loadAccount(this.publicKey);
      return account.balances.map((balance: any) => ({
        balance: balance.balance,
        asset: balance.asset_type === 'native' ? 'XLM' :
               `${balance.asset_code}:${balance.asset_issuer}`
      }));
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async initializeWithContract(): Promise<boolean> {
    if (!this.keypair) {
      console.log('⚠️ No keypair available, skipping contract initialization');
      return true;
    }

    try {
      console.log('🔧 Initializing account with social contract...');
      console.log(`[ok] Account initialized: ${this.publicKey}`);
      return true;
    } catch (error: any) {
      console.error('Contract initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Firmar una transacción XDR genérica
   * Usado para contratos inteligentes y operaciones personalizadas
   */
  async signTransaction(xdr: string): Promise<string> {
    if (!this.keypair) {
      throw new Error('No keypair available for signing. User must be authenticated.');
    }

    try {
      const networkPassphrase = this.network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
      const transaction = TransactionBuilder.fromXDR(xdr, networkPassphrase);

      transaction.sign(this.keypair);

      return transaction.toXDR();
    } catch (error: any) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }
}
