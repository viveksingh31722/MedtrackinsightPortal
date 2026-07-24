import { Router } from 'express';
import { createOrder, verifyPayment, getUserInvoices, downloadInvoicePdf, handleWebhook } from '../controllers/payment.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Order creation - Authenticated users get order parameters for Razorpay checkout dialog
router.post('/order', authenticateJWT, createOrder);

// Payment confirmation - Validates checkout signature and assigns Pro subscription duration
router.post('/verify', authenticateJWT, verifyPayment);

// Webhook endpoint for Razorpay payment captured/order paid notifications
router.post('/webhook', handleWebhook);

// Get list of all billing invoices for the user
router.get('/invoices', authenticateJWT, getUserInvoices);

// Download specific billing invoice as a PDF
router.get('/invoice/:id/download', authenticateJWT, downloadInvoicePdf);

export default router;
export { router as paymentRoutes };
