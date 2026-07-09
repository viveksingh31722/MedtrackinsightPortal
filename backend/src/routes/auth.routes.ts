import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  verifySignup,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  updateProfile,
  updatePreferences,
} from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Public auth routes
router.post('/register', register);
router.post('/verify-signup', verifySignup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

// Authenticated user profile, preference, and password change routes
router.get('/me', authenticateJWT, getMe);
router.post('/change-password', authenticateJWT, changePassword);
router.put('/profile', authenticateJWT, updateProfile);
router.put('/preferences', authenticateJWT, updatePreferences);

export default router;
export { router as authRoutes };

