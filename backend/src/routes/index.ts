import { Router } from 'express';
import paymentRoutes from './payment.routes';
import artisanRoutes from './artisan.routes';
import orderRoutes from './order.routes';
import userRoutes from './user.routes';
import transactionRoutes from './transaction.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/payments', paymentRoutes);
router.use('/artisans', artisanRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/admin', adminRoutes);

export default router;