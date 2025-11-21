import { Router } from 'express';
import paymentRoutes from './payment.routes';
import artisanRoutes from './artisan.routes';
import orderRoutes from './order.routes';

const router = Router();

router.use('/payments', paymentRoutes);
router.use('/artisans', artisanRoutes);
router.use('/orders', orderRoutes);

export default router;