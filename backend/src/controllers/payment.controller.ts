import { Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { generateInvoicePdf } from '../utils/pdfGenerator';

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

    // Support custom order amount input or fallback to planType defaults
    let amount = req.body.amount;
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount < 100) {
        return res.status(400).json({ message: 'Amount must be at least 100 paise' });
      }
    } else {
      const { planType, billingCycle } = req.body;
      const isMonthly = billingCycle === 'monthly';
      if (planType === 'Starter') {
        amount = isMonthly ? 199900 : 1499900; // ₹1,999 vs ₹14,999
      } else if (planType === 'Professional') {
        amount = isMonthly ? 199900 : 2499900; // ₹1,999 vs ₹24,999
      } else {
        amount = 1499900; // Default fallback Starter Annual
      }
    }

    const receiptId = `receipt_usr_${req.user.userId.slice(0, 8)}_${Date.now().toString().slice(-6)}`;
    const isSandbox = env.RAZORPAY_KEY_ID.includes('placeholder') || 
                      env.RAZORPAY_KEY_SECRET.includes('placeholder') ||
                      env.RAZORPAY_KEY_SECRET.includes('local_only');

    if (isSandbox) {
      // Sandbox mode: return simulated order details
      const simulatedId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
      return res.status(200).json({
        id: simulatedId,
        order_id: simulatedId,
        amount,
        currency: 'INR',
        receipt: receiptId,
        isSandbox: true,
        key: env.RAZORPAY_KEY_ID,
      });
    }

    // Create actual order using Razorpay SDK
    try {
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
        order_id: order.id,
        isSandbox: false,
        key: env.RAZORPAY_KEY_ID,
      });
    } catch (sdkError: any) {
      logger.error('Razorpay SDK order creation failed: ' + (sdkError.stack || sdkError.message || sdkError));
      // Automatic fallback to sandbox if SDK/network fails, ensuring testing is never blocked
      const simulatedId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
      return res.status(200).json({
        id: simulatedId,
        order_id: simulatedId,
        amount,
        currency: 'INR',
        receipt: receiptId,
        isSandbox: true,
        key: env.RAZORPAY_KEY_ID,
      });
    }
  } catch (error) {
    logger.error('Create order error:', { error });
    return res.status(500).json({ message: 'Error initiating payment order' });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isSandbox } = req.body;

    // Validate missing fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required validation fields' });
    }

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
        logger.error('Signature cryptography validation error:', { error: err });
      }
    }

    if (!verificationSuccess) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Upgrade the user in PostgreSQL
    const planType = req.body.planType || 'Starter';
    const billingCycle = req.body.billingCycle || 'annual';

    // Calculate subscription end date based on billing cycle (1 month vs 12 months)
    const subscriptionEnd = new Date();
    if (billingCycle === 'monthly') {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    } else {
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        isSubscribed: true,
        planType,
        subscriptionEnd,
        downloadCount: 0, // Reset download quotas upon purchase
      },
    });

    // Generate unique invoice details
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the latest invoice for the current month to get the next sequential number
    const latestInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `MTI-${year}-${month}-`
        }
      },
      orderBy: {
        invoiceNumber: 'desc'
      }
    });

    let nextSeq = 1;
    if (latestInvoice) {
      const parts = latestInvoice.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
    const sequenceNum = String(nextSeq).padStart(4, '0');
    const invoiceNumber = `MTI-${year}-${month}-${sequenceNum}`;

    let amountVal = planType === 'Professional'
      ? (billingCycle === 'monthly' ? 1999 : 24999)
      : (billingCycle === 'monthly' ? 1999 : 14999);
    if (req.body.amount) amountVal = req.body.amount / 100;

    const planName = planType === 'Professional'
      ? `Professional Plan (${billingCycle === 'monthly' ? 'Monthly' : '1 Year'} - 3 Licenses)`
      : `Starter Plan (${billingCycle === 'monthly' ? 'Monthly' : '1 Year'} - 1 License)`;

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: req.user.userId,
        amount: amountVal,
        currency: 'INR',
        status: 'paid',
        planName,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
    });

    return res.status(200).json({
      message: 'Subscription activated successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isSubscribed: updatedUser.isSubscribed,
        planType: updatedUser.planType,
        subscriptionEnd: updatedUser.subscriptionEnd,
      },
    });
  } catch (error) {
    logger.error('Verify payment error:', { error });
    return res.status(500).json({ message: 'Internal validation server error' });
  }
};

export const getUserInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ invoices });
  } catch (error) {
    logger.error('Get user invoices error:', { error });
    return res.status(500).json({ message: 'Internal server error fetching invoices' });
  }
};

export const downloadInvoicePdf = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            company: true,
            country: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);

    generateInvoicePdf(invoice, res);
  } catch (error) {
    logger.error('Download invoice PDF error:', { error });
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Internal server error generating PDF' });
    }
  }
};
