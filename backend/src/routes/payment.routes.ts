import { Router } from 'express';
import paymentController from '../controllers/payment.controller';

const router = Router();

router.post('/initiate', (req, res) => paymentController.initiatePayment(req, res));
router.post('/confirm', (req, res) => paymentController.confirmPayment(req, res));
router.get('/:id/status', (req, res) => paymentController.getPaymentStatus(req, res));

export default router;