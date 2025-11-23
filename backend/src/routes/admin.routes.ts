import { Router } from 'express';
import adminController from '../controllers/admin.controller';

const router = Router();

// Verificar artesano (requiere password de admin)
router.post('/verify-artisan', (req, res) => adminController.verifyArtisan(req, res));

// Ver estado de un artesano
router.get('/check/:stellar_address', (req, res) => adminController.checkArtisan(req, res));

export default router;
