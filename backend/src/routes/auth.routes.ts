import { Router } from 'express';
import { register, login, refresh, logout, getMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Authenticated user profile retrieval route
router.get('/me', authenticateJWT, getMe);

export default router;
export { router as authRoutes };
