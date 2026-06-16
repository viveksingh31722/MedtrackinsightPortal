import { Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

/**
 * Payment Verification Concept:
 * Under production systems, Razorpay issues an 'order_id', 'payment_id', and a cryptographic 'signature'.
 * The backend verifies the signature by generating an HMAC-SHA256 hash using the secret key
 * and compares it with the signature sent by the frontend client.
 */

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { planType } = req.body; // e.g., 'Pro' ($1,499) or 'Basic' ($499)
    let amount = 149900; // Default: Pro Plan in Paise (Rs 1,499.00)
    
    if (planType === 'Basic') {
      amount = 49900; // Basic Plan in Paise (Rs 499.00)
    }

    const receiptId = `receipt_usr_${req.user.userId.slice(0, 8)}_${Date.now().toString().slice(-6)}`;
    const isSandbox = env.RAZORPAY_KEY_ID.includes('placeholderkeyid') || env.RAZORPAY_KEY_SECRET === 'placeholdersecretkey';

    if (isSandbox) {
      // Sandbox mode: return simulated order details
      return res.status(200).json({
        id: `order_sim_${crypto.randomBytes(8).toString('hex')}`,
        amount,
        currency: 'INR',
        receipt: receiptId,
        isSandbox: true,
        key: env.RAZORPAY_KEY_ID,
      });
    }

    // Try creating actual order using Razorpay SDK if keys are provided
    try {
      // Import razorpay dynamically so server starts even if library not loaded or broken
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });

      const order = await rzp.orders.create({
        amount,
        currency: 'INR',
        receipt: receiptId,
      });

      return res.status(200).json({
        ...order,
        isSandbox: false,
        key: env.RAZORPAY_KEY_ID,
      });
    } catch (sdkError: any) {
      console.warn('Razorpay SDK initialization failed, falling back to simulated checkout.', sdkError.message);
      return res.status(200).json({
        id: `order_sim_${crypto.randomBytes(8).toString('hex')}`,
        amount,
        currency: 'INR',
        receipt: receiptId,
        isSandbox: true,
        key: env.RAZORPAY_KEY_ID,
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Error initiating payment order' });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isSandbox } = req.body;

    let verificationSuccess = false;

    if (isSandbox || razorpay_order_id.startsWith('order_sim_')) {
      // Sandbox mode automatically succeeds payment validation
      verificationSuccess = true;
    } else {
      // Production mode: verify HMAC-SHA256 signature
      try {
        const text = razorpay_order_id + '|' + razorpay_payment_id;
        const generated_signature = crypto
          .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
          .update(text)
          .digest('hex');

        if (generated_signature === razorpay_signature) {
          verificationSuccess = true;
        }
      } catch (err) {
        console.error('Signature cryptography validation error:', err);
      }
    }

    if (!verificationSuccess) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Upgrade the user in PostgreSQL
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30); // 30-day billing cycle

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        isSubscribed: true,
        subscriptionEnd,
        downloadCount: 0, // Reset download quotas upon purchase
      },
    });

    return res.status(200).json({
      message: 'Subscription activated successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isSubscribed: updatedUser.isSubscribed,
        subscriptionEnd: updatedUser.subscriptionEnd,
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ message: 'Internal validation server error' });
  }
};
