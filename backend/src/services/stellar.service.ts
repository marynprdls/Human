import * as StellarSDK from '@stellar/stellar-sdk';
import { server, USDC_ASSET, USDC_ISSUER } from '../config/stellar';

interface PaymentVerification {
  valid: boolean;
  reason?: string;
  payment?: any;
}

class StellarService {
  /**
   * Verificar transacción USDC en Horizon
   * CRÍTICO - 8 validaciones
   */
  async verifyPayment(
    txHash: string,
    expectedDest: string,
    expectedAmount: number
  ): Promise<PaymentVerification> {
    try {
      // 1. Obtener TX de Horizon
      const tx = await server.transactions().transaction(txHash).call();
      
      // 2. Verificar que TX fue exitosa
      if (!tx.successful) {
        return { valid: false, reason: 'Transaction failed on-chain' };
      }
      
      // 3. Obtener operaciones de la TX
      const operations = await server.operations().forTransaction(txHash).call();
      
      // 4. Buscar operación de payment
      const paymentOp = operations.records.find((op: any) => {
        if (op.type !== 'payment') return false;
        
        // 5. Verificar destinatario
        const correctDest = op.to === expectedDest;
        
        // 6. Verificar que es USDC
        const isUSDC = op.asset_code === 'USDC' && op.asset_issuer === USDC_ISSUER;
        
        // 7. Verificar monto (con tolerancia de 0.01)
        const amountMatch = Math.abs(parseFloat(op.amount) - expectedAmount) < 0.01;
        
        return correctDest && isUSDC && amountMatch;
      });
      
      // 8. Validar que encontramos el payment
      if (!paymentOp) {
        return { 
          valid: false, 
          reason: 'No matching USDC payment found in transaction' 
        };
      }
      
      return { valid: true, payment: paymentOp };
      
    } catch (error: any) {
      return { 
        valid: false, 
        reason: `Error fetching transaction: ${error.message}` 
      };
    }
  }
  
  /**
   * Verificar si cuenta tiene trustline USDC
   */
  async hasUSDCTrustline(publicKey: string): Promise<boolean> {
    try {
      const account = await server.loadAccount(publicKey);
      return account.balances.some((b: any) =>
        b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
      );
    } catch (error) {
      console.error('Error checking trustline:', error);
      return false;
    }
  }
  
  /**
   * Generar Stellar URI para QR codes
   */
  generatePaymentURI(dest: string, amount: number, memo: string): string {
    const params = new URLSearchParams({
      amount: amount.toString(),
      memo,
      asset: `USDC:${USDC_ISSUER}`
    });
    return `web+stellar:pay?destination=${dest}&${params.toString()}`;
  }
  
  /**
   * Obtener balance USDC de una cuenta
   */
  async getUSDCBalance(publicKey: string): Promise<number> {
    try {
      const account = await server.loadAccount(publicKey);
      const usdcBalance = account.balances.find((b: any) =>
        b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
      );
      return usdcBalance ? parseFloat(usdcBalance.balance) : 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }
  
  /**
   * Validar formato de dirección Stellar
   */
  isValidStellarAddress(address: string): boolean {
    try {
      StellarSDK.StrKey.decodeEd25519PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

/**
   * Verificar transacción XLM (nativo) en Horizon
   */
async verifyPaymentXLM(
  txHash: string,
  expectedDest: string,
  expectedAmount: number
): Promise<PaymentVerification> {
  try {
    console.log('🔍 Verifying XLM payment:', { txHash, expectedDest, expectedAmount });
    
    const tx = await server.transactions().transaction(txHash).call();
    
    if (!tx.successful) {
      return { valid: false, reason: 'Transaction failed on-chain' };
    }
    
    const operations = await server.operations().forTransaction(txHash).call();
    
    const paymentOp = operations.records.find((op: any) => {
      if (op.type !== 'payment') return false;
      
      const correctDest = op.to === expectedDest;
      const isXLM = op.asset_type === 'native';
      const amountMatch = Math.abs(parseFloat(op.amount) - expectedAmount) < 0.01;
      
      console.log('💳 Payment operation check:', {
        type: op.type,
        to: op.to,
        expectedDest,
        correctDest,
        asset_type: op.asset_type,
        isXLM,
        amount: op.amount,
        expectedAmount,
        amountMatch
      });
      
      return correctDest && isXLM && amountMatch;
    });
    
    if (!paymentOp) {
      return { 
        valid: false, 
        reason: 'No matching XLM payment found in transaction' 
      };
    }
    
    console.log('✅ XLM payment verified successfully');
    return { valid: true, payment: paymentOp };
    
  } catch (error: any) {
    console.error('❌ Error verifying XLM payment:', error);
    return { 
      valid: false, 
      reason: `Error fetching transaction: ${error.message}` 
    };
  }
}

/**
 * Generar Stellar URI para pago XLM (sin asset)
 */
generatePaymentURIXLM(dest: string, amount: number, memo: string): string {
  const params = new URLSearchParams({
    amount: amount.toString(),
    memo
    // XLM nativo no necesita especificar asset
  });
  return `web+stellar:pay?destination=${dest}&${params.toString()}`;
}

/**
 * Obtener balance XLM de una cuenta
 */
async getXLMBalance(publicKey: string): Promise<number> {
  try {
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find((b: any) => b.asset_type === 'native');
    return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
  } catch (error) {
    console.error('Error getting XLM balance:', error);
    return 0;
  }
}

/**
 * Verificar si cuenta existe y está fondeada
 */
async isAccountFunded(publicKey: string): Promise<boolean> {
  try {
    const balance = await this.getXLMBalance(publicKey);
    return balance >= 1; // Mínimo 1 XLM para estar activa
  } catch (error) {
    return false;
  }
}
}


export default new StellarService();
