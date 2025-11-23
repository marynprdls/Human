import { Request, Response } from 'express';
import stellarService from '../services/stellar.service';

export class TransactionController {
  /**
   * GET /api/transactions/:address
   * Obtener historial de transacciones de una cuenta
   */
  async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { limit = 20 } = req.query;

      console.log(`📜 Getting transaction history for ${address}`);

      // Validar dirección
      if (!stellarService.isValidStellarAddress(address)) {
        res.status(400).json({ error: 'Invalid Stellar address' });
        return;
      }

      // Validar límite
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ error: 'Limit must be between 1 and 100' });
        return;
      }

      // Obtener transacciones
      const transactions = await stellarService.getTransactionHistory(address, limitNum);

      console.log(`✅ Returning ${transactions.length} transactions`);

      res.json({
        address,
        total: transactions.length,
        limit: limitNum,
        transactions
      });

    } catch (error) {
      console.error('❌ Error getting transaction history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/transactions/:address/balance
   * Obtener balance actual de una cuenta
   */
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;

      console.log(`💰 Getting balance for ${address}`);

      if (!stellarService.isValidStellarAddress(address)) {
        res.status(400).json({ error: 'Invalid Stellar address' });
        return;
      }

      const xlmBalance = await stellarService.getXLMBalance(address);

      res.json({
        address,
        xlm: xlmBalance,
        asset: 'XLM'
      });

    } catch (error) {
      console.error('❌ Error getting balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new TransactionController();
