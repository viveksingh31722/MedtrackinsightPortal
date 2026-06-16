import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Order creation - Authenticated users get order parameters for Razorpay checkout dialog
router.post('/order', authenticateJWT, createOrder);

// Payment confirmation - Validates checkout signature and assigns Pro subscription duration
router.post('/verify', authenticateJWT, verifyPayment);

export default router;
export { router as paymentRoutes };
