import { Router } from 'express';
import userController from '../controllers/user.controller';

const router = Router();

// Registrar nuevo usuario
router.post('/register', (req, res) => userController.register(req, res));

// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise Express will match the parameter route first

// Obtener todos los usuarios (SPECIFIC - must be before /:stellar_address)
router.get('/', (req, res) => userController.getAllUsers(req, res));

// Obtener usuario por Google Sub ID (SPECIFIC - must be before /:stellar_address)
router.get('/by-google/:google_sub', (req, res) => userController.getUserByGoogleSub(req, res));

// Obtener usuario por dirección Stellar (GENERIC - must be after specific routes)
router.get('/:stellar_address', (req, res) => userController.getUser(req, res));

// Actualizar usuario
router.put('/:stellar_address', (req, res) => userController.updateUser(req, res));

export default router;
