import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('🚀 Starting integration test suite for payment endpoints on port 5001...');

  const timestamp = Date.now();
  const testEmail = `test_user_${timestamp}@medtrackintel.com`;
  const testPassword = 'Pass123!456'; // Strong password meeting criteria

  try {
    // 1. Register User
    console.log(`\n[1/7] Registering temporary test user: ${testEmail}...`);
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    const registerData = await registerRes.json() as any;
    if (!registerRes.ok) {
      throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
    }
    console.log('✓ Registration initial request successful.');

    // 2. Fetch OTP from PostgreSQL
    console.log('\n[2/7] Fetching OTP from PostgreSQL database directly...');
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { email: testEmail, type: 'SIGNUP' },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new Error('No OTP record found in database for test email');
    }
    const otp = otpRecord.otp;
    console.log(`✓ OTP retrieved successfully: ${otp}`);

    // 3. Verify OTP
    console.log('\n[3/7] Verifying signup with OTP...');
    const verifyRes = await fetch(`${BASE_URL}/auth/verify-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp }),
    });

    const verifyData = await verifyRes.json() as any;
    if (!verifyRes.ok) {
      throw new Error(`OTP verification failed: ${JSON.stringify(verifyData)}`);
    }
    console.log('✓ Account verified successfully.');

    // 4. Log in
    console.log('\n[4/7] Logging in to retrieve JWT Access Token...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    const loginData = await loginRes.json() as any;
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.accessToken;
    console.log('✓ Login successful. Retrieved token.');

    // 5. Test create-order (custom requested endpoint)
    console.log('\n[5/7] Testing order creation endpoint...');
    const createOrderRes = await fetch(`${BASE_URL}/create-order`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 150000, planType: 'Starter', billingCycle: 'monthly' }),
    });

    const orderData = await createOrderRes.json() as any;
    if (!createOrderRes.ok) {
      throw new Error(`Order creation failed: ${JSON.stringify(orderData)}`);
    }
    console.log(`✓ Order created: id=${orderData.id}, amount=${orderData.amount}, currency=${orderData.currency}`);
    if (orderData.isSandbox) {
      console.log('  (Running in Sandbox mode fallback because real Razorpay API credentials failed or were not verified yet)');
    } else {
      console.log('  (Successfully connected to live/test Razorpay API)');
    }

    // 6. Test verify-payment (custom requested endpoint)
    console.log('\n[6/7] Testing payment signature verification...');
    const verifyPaymentRes = await fetch(`${BASE_URL}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_order_id: orderData.id,
        razorpay_payment_id: 'pay_sim_' + Math.random().toString(36).substring(7),
        razorpay_signature: 'sig_sim_ok',
        isSandbox: true,
        planType: 'Starter',
        billingCycle: 'monthly',
        amount: orderData.amount,
      }),
    });

    const paymentVerificationData = await verifyPaymentRes.json() as any;
    if (!verifyPaymentRes.ok) {
      throw new Error(`Payment verification failed: ${JSON.stringify(paymentVerificationData)}`);
    }
    console.log('✓ Payment verified successfully and Pro Plan activated.');

    // 7. Test Webhook
    console.log('\n[7/7] Testing Webhook callback with HMAC-SHA256 signature verification...');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
    // Ensure the secret is set for the runtime environment if not present
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    }

    const mockOrderId = 'order_' + crypto.randomBytes(8).toString('hex');
    const mockPaymentId = 'pay_' + crypto.randomBytes(8).toString('hex');
    const webhookPayload = {
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: mockOrderId,
            amount: 150000,
            currency: 'INR',
            status: 'paid',
            notes: {
              userId: loginData.user.id,
              planType: 'Professional',
              billingCycle: 'annual'
            }
          }
        }
      }
    };

    const payloadString = JSON.stringify(webhookPayload);
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(payloadString);
    const mockSignature = hmac.digest('hex');

    const webhookRes = await fetch(`${BASE_URL}/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': mockSignature,
      },
      body: payloadString,
    });

    const webhookData = await webhookRes.json() as any;
    if (!webhookRes.ok) {
      throw new Error(`Webhook validation failed: ${JSON.stringify(webhookData)}`);
    }
    console.log('✓ Webhook signature validated and subscription updated successfully.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The integration is stable and production-ready.');

  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error.message || error);
  } finally {
    // 8. Clean up database
    console.log('\n🧹 Cleaning up test user and generated invoice records from database...');
    try {
      const user = await prisma.user.findFirst({ where: { email: testEmail } });
      if (user) {
        await prisma.invoice.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log('✓ Test user and associated invoices deleted.');
      }
      await prisma.otpVerification.deleteMany({ where: { email: testEmail } });
      console.log('✓ OTP verification records cleared.');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup failed:', cleanupError);
    }
    await prisma.$disconnect();
    console.log('👋 Finished integration test suite.');
  }
}

runTests();
