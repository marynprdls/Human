import { Router } from 'express';
import artisanController from '../controllers/artisan.controller';

const router = Router();

router.post('/metadata', (req, res) => artisanController.saveMetadata(req, res));
router.get('/verified', (req, res) => artisanController.getVerifiedArtisans(req, res));
router.get('/nearby', (req, res) => artisanController.getNearbyArtisans(req, res));
router.get('/:address', (req, res) => artisanController.getArtisan(req, res));
router.get('/', (req, res) => artisanController.listArtisans(req, res));

export default router;