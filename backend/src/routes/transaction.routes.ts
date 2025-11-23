import { Router } from 'express';
import transactionController from '../controllers/transaction.controller';

const router = Router();

// Obtener historial de transacciones
router.get('/:address', (req, res) => transactionController.getTransactionHistory(req, res));

// Obtener balance
router.get('/:address/balance', (req, res) => transactionController.getBalance(req, res));

export default router;
