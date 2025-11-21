import { Router } from 'express';
import orderController from '../controllers/order.controller';

const router = Router();

// Crear orden
router.post('/create', (req, res) => orderController.createOrder(req, res));

// Obtener orden por ID
router.get('/:id', (req, res) => orderController.getOrder(req, res));

// Confirmar pago de orden
router.post('/:id/pay', (req, res) => orderController.confirmOrderPayment(req, res));

// Obtener órdenes de un artesano
router.get('/artisan/:address', (req, res) => orderController.getArtisanOrders(req, res));

export default router;