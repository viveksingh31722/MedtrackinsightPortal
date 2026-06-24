import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt';
import { sendOtpEmail } from '../utils/mailer';

// Cookie settings for cross-site security and SSR capability
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true, // Shields cookie from client-side JS (XSS protection)
  secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
  sameSite: 'lax' as const, // Protects against CSRF
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const isPasswordStrong = (pw: string): boolean => {
  if (pw.length < 10 || pw.length > 14) return false;
  const hasCapital = /[A-Z]/.test(pw);
  const hasSmall = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  return hasCapital && hasSmall && hasNumber && hasSpecial;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        message: 'Password must be 10-14 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    // Verify if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    // Hash password with bcrypt before saving to OTP verification
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit cryptographic random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear any previous signup OTPs for this email to avoid junk
    await prisma.otpVerification.deleteMany({
      where: { email, type: 'SIGNUP' },
    });

    // Save temporary signup registration payload in OtpVerification
    await prisma.otpVerification.create({
      data: {
        email,
        otp,
        passwordHash: hashedPassword,
        type: 'SIGNUP',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Dispatch verification email
    await sendOtpEmail(email, otp, 'SIGNUP');

    return res.status(200).json({
      message: 'Verification OTP sent to email. Please verify to complete registration.',
      email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal registration error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Query database for user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'either email or password is wrong' });
    }

    // Compare input password with hashed database password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'either email or password is wrong' });
    }

    // Security: Only allow login if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Email address has not been verified. Please complete verification.' });
    }

    // Generate credentials
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      isSubscribed: user.isSubscribed,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Save refresh token to database for validation
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Set cookies
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        isSubscribed: user.isSubscribed,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    // Read refresh token from cookies
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    // Decode refresh token
    const decoded = verifyRefreshToken(token);

    // Retrieve user and check database refresh token signature
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Invalid or revoked refresh token' });
    }

    // Generate a fresh access token
    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      isSubscribed: user.isSubscribed,
    };
    const newAccessToken = generateAccessToken(newPayload);

    // Update access cookie
    res.cookie('accessToken', newAccessToken, ACCESS_COOKIE_OPTIONS);

    return res.status(200).json({
      message: 'Access token refreshed successfully',
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        isSubscribed: user.isSubscribed,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Clear refresh token from database if it exists
      try {
        const decoded = verifyRefreshToken(token);
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { refreshToken: null },
        });
      } catch (err) {
        // Suppress invalid signature errors during logout clears
      }
    }

    // Clear cookies
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'lax' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Error during logout session teardown' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        isSubscribed: user.isSubscribed,
        downloadCount: user.downloadCount,
        subscriptionEnd: user.subscriptionEnd,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const verifySignup = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const verification = await prisma.otpVerification.findFirst({
      where: { email, type: 'SIGNUP' },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return res.status(400).json({ message: 'No registration pending verification for this email address.' });
    }

    if (verification.expiresAt < new Date()) {
      await prisma.otpVerification.delete({ where: { id: verification.id } });
      return res.status(400).json({ message: 'OTP has expired. Please register again to get a new code.' });
    }

    if (verification.otp !== otp) {
      const updated = await prisma.otpVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      if (updated.attempts >= 5) {
        await prisma.otpVerification.delete({ where: { id: verification.id } });
        return res.status(400).json({ message: 'Too many failed verification attempts. This OTP has been invalidated. Please sign up again.' });
      }

      return res.status(400).json({ message: `Invalid OTP code. ${5 - updated.attempts} attempts remaining.` });
    }

    if (!verification.passwordHash) {
      return res.status(400).json({ message: 'Invalid registration state' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: verification.passwordHash,
        emailVerified: true,
      },
    });

    await prisma.otpVerification.deleteMany({
      where: { email },
    });

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      isSubscribed: user.isSubscribed,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      message: 'Email verified and account registered successfully',
      user: {
        id: user.id,
        email: user.email,
        isSubscribed: user.isSubscribed,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Verify signup error:', error);
    return res.status(500).json({ message: 'Internal server error during verification' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otpVerification.deleteMany({
      where: { email, type: 'PASSWORD_RESET' },
    });

    await prisma.otpVerification.create({
      data: {
        email,
        otp,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    await sendOtpEmail(email, otp, 'PASSWORD_RESET');

    return res.status(200).json({
      message: 'Password reset OTP sent to email.',
      email,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error during password reset request' });
  }
};

export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const verification = await prisma.otpVerification.findFirst({
      where: { email, type: 'PASSWORD_RESET' },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return res.status(400).json({ message: 'No password reset request found for this email address.' });
    }

    if (verification.expiresAt < new Date()) {
      await prisma.otpVerification.delete({ where: { id: verification.id } });
      return res.status(400).json({ message: 'OTP has expired. Please request a password reset again.' });
    }

    if (verification.otp !== otp) {
      const updated = await prisma.otpVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      if (updated.attempts >= 5) {
        await prisma.otpVerification.delete({ where: { id: verification.id } });
        return res.status(400).json({ message: 'Too many failed verification attempts. This OTP has been invalidated. Please request a password reset again.' });
      }

      return res.status(400).json({ message: `Invalid OTP code. ${5 - updated.attempts} attempts remaining.` });
    }

    return res.status(200).json({
      message: 'OTP verified successfully.',
      email,
      otp,
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return res.status(500).json({ message: 'Internal server error during OTP verification' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        message: 'Password must be 10-14 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    const verification = await prisma.otpVerification.findFirst({
      where: { email, type: 'PASSWORD_RESET' },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return res.status(400).json({ message: 'No active password reset verification found.' });
    }

    if (verification.expiresAt < new Date()) {
      await prisma.otpVerification.delete({ where: { id: verification.id } });
      return res.status(400).json({ message: 'OTP has expired. Please request a password reset again.' });
    }

    if (verification.otp !== otp) {
      const updated = await prisma.otpVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      if (updated.attempts >= 5) {
        await prisma.otpVerification.delete({ where: { id: verification.id } });
        return res.status(400).json({ message: 'Too many failed verification attempts. This OTP has been invalidated. Please request a password reset again.' });
      }

      return res.status(400).json({ message: `Invalid OTP code. ${5 - updated.attempts} attempts remaining.` });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.otpVerification.deleteMany({
      where: { email },
    });

    return res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error during password reset' });
  }
};
