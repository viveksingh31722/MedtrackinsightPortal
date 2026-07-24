import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt';
import { sendOtpEmail } from '../services/email.service';

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

    // Dispatch verification email in the background to avoid blocking the API response
    sendOtpEmail(email, otp, 'SIGNUP').catch((err) => {
      logger.error('Failed to dispatch registration OTP email:', { error: err });
    });

    return res.status(200).json({
      message: 'Verification OTP sent to email. Please verify to complete registration.',
      email,
    });
  } catch (error) {
    logger.error('Registration error:', { error: error });
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
    const isAdmin = user.email === env.ADMIN_EMAIL;
    const passwordExpired = Date.now() - new Date(user.passwordChangedAt).getTime() > 90 * 24 * 60 * 60 * 1000;

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      isSubscribed: user.isSubscribed,
      isAdmin,
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
        planType: user.planType || 'Basic',
        subscriptionEnd: user.subscriptionEnd,
        downloadCount: user.downloadCount,
        isAdmin,
        passwordExpired,
        name: user.name,
        phone: user.phone,
        company: user.company,
        designation: user.designation,
        country: user.country,
        department: user.department,
        prefNewTrials: user.prefNewTrials,
        prefAlerts: user.prefAlerts,
        prefDeals: user.prefDeals,
        prefNewsletter: user.prefNewsletter,
        prefMarketing: user.prefMarketing,
        prefTheme: user.prefTheme,
        prefDefaultCountry: user.prefDefaultCountry,
        prefDefaultTherapeuticArea: user.prefDefaultTherapeuticArea,
        createdAt: user.createdAt,
      },
      accessToken,
    });
  } catch (error) {
    logger.error('Login error:', { error: error });
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
    logger.error('Refresh token error:', { error: error });
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
    logger.error('Logout error:', { error: error });
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

    const isAdmin = user.email === env.ADMIN_EMAIL;
    const passwordExpired = Date.now() - new Date(user.passwordChangedAt).getTime() > 90 * 24 * 60 * 60 * 1000;

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        isSubscribed: user.isSubscribed,
        planType: user.planType || 'Basic',
        downloadCount: user.downloadCount,
        subscriptionEnd: user.subscriptionEnd,
        isAdmin,
        passwordExpired,
        name: user.name,
        phone: user.phone,
        company: user.company,
        designation: user.designation,
        country: user.country,
        department: user.department,
        prefNewTrials: user.prefNewTrials,
        prefAlerts: user.prefAlerts,
        prefDeals: user.prefDeals,
        prefNewsletter: user.prefNewsletter,
        prefMarketing: user.prefMarketing,
        prefTheme: user.prefTheme,
        prefDefaultCountry: user.prefDefaultCountry,
        prefDefaultTherapeuticArea: user.prefDefaultTherapeuticArea,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Get me error:', { error: error });
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

    const isAdmin = user.email === env.ADMIN_EMAIL;
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      isSubscribed: user.isSubscribed,
      isAdmin,
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
        isAdmin,
        name: user.name,
        phone: user.phone,
        company: user.company,
        designation: user.designation,
        country: user.country,
        department: user.department,
        prefNewTrials: user.prefNewTrials,
        prefAlerts: user.prefAlerts,
        prefDeals: user.prefDeals,
        prefNewsletter: user.prefNewsletter,
        prefMarketing: user.prefMarketing,
        prefTheme: user.prefTheme,
        prefDefaultCountry: user.prefDefaultCountry,
        prefDefaultTherapeuticArea: user.prefDefaultTherapeuticArea,
        createdAt: user.createdAt,
      },
      accessToken,
    });
  } catch (error) {
    logger.error('Verify signup error:', { error: error });
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

    // Dispatch verification email in the background to avoid blocking the API response
    sendOtpEmail(email, otp, 'PASSWORD_RESET').catch((err) => {
      logger.error('Failed to dispatch password reset OTP email:', { error: err });
    });

    return res.status(200).json({
      message: 'Password reset OTP sent to email.',
      email,
    });
  } catch (error) {
    logger.error('Forgot password error:', { error: error });
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
    logger.error('Verify reset OTP error:', { error: error });
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
        passwordChangedAt: new Date(),
      },
    });

    await prisma.otpVerification.deleteMany({
      where: { email },
    });

    return res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    logger.error('Reset password error:', { error: error });
    return res.status(500).json({ message: 'Internal server error during password reset' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (!authReq.user || !authReq.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    // Retrieve user from DB
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password matches oldPassword
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'The current password you entered is incorrect' });
    }

    // Validate new password strength
    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        message: 'Password must be 10-14 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Change password error:', { error: error });
    return res.status(500).json({ message: 'Internal server error during password update' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (!authReq.user || !authReq.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { name, phone, company, designation, country, department } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: authReq.user.userId },
      data: {
        name: name !== undefined ? name : null,
        phone: phone !== undefined ? phone : null,
        company: company !== undefined ? company : null,
        designation: designation !== undefined ? designation : null,
        country: country !== undefined ? country : null,
        department: department !== undefined ? department : null,
      },
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isSubscribed: updatedUser.isSubscribed,
        downloadCount: updatedUser.downloadCount,
        subscriptionEnd: updatedUser.subscriptionEnd,
        isAdmin: updatedUser.email === env.ADMIN_EMAIL,
        passwordExpired: Date.now() - new Date(updatedUser.passwordChangedAt).getTime() > 90 * 24 * 60 * 60 * 1000,
        name: updatedUser.name,
        phone: updatedUser.phone,
        company: updatedUser.company,
        designation: updatedUser.designation,
        country: updatedUser.country,
        department: updatedUser.department,
        prefNewTrials: updatedUser.prefNewTrials,
        prefAlerts: updatedUser.prefAlerts,
        prefDeals: updatedUser.prefDeals,
        prefNewsletter: updatedUser.prefNewsletter,
        prefMarketing: updatedUser.prefMarketing,
        prefTheme: updatedUser.prefTheme,
        prefDefaultCountry: updatedUser.prefDefaultCountry,
        prefDefaultTherapeuticArea: updatedUser.prefDefaultTherapeuticArea,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    logger.error('Update profile error:', { error: error });
    return res.status(500).json({ message: 'Internal server error during profile update' });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (!authReq.user || !authReq.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const {
      prefNewTrials,
      prefAlerts,
      prefDeals,
      prefNewsletter,
      prefMarketing,
      prefTheme,
      prefDefaultCountry,
      prefDefaultTherapeuticArea,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: authReq.user.userId },
      data: {
        prefNewTrials: prefNewTrials !== undefined ? !!prefNewTrials : undefined,
        prefAlerts: prefAlerts !== undefined ? !!prefAlerts : undefined,
        prefDeals: prefDeals !== undefined ? !!prefDeals : undefined,
        prefNewsletter: prefNewsletter !== undefined ? !!prefNewsletter : undefined,
        prefMarketing: prefMarketing !== undefined ? !!prefMarketing : undefined,
        prefTheme: prefTheme !== undefined ? String(prefTheme) : undefined,
        prefDefaultCountry: prefDefaultCountry !== undefined ? String(prefDefaultCountry) : undefined,
        prefDefaultTherapeuticArea: prefDefaultTherapeuticArea !== undefined ? String(prefDefaultTherapeuticArea) : undefined,
      },
    });

    return res.status(200).json({
      message: 'Preferences updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isSubscribed: updatedUser.isSubscribed,
        downloadCount: updatedUser.downloadCount,
        subscriptionEnd: updatedUser.subscriptionEnd,
        isAdmin: updatedUser.email === env.ADMIN_EMAIL,
        passwordExpired: Date.now() - new Date(updatedUser.passwordChangedAt).getTime() > 90 * 24 * 60 * 60 * 1000,
        name: updatedUser.name,
        phone: updatedUser.phone,
        company: updatedUser.company,
        designation: updatedUser.designation,
        country: updatedUser.country,
        department: updatedUser.department,
        prefNewTrials: updatedUser.prefNewTrials,
        prefAlerts: updatedUser.prefAlerts,
        prefDeals: updatedUser.prefDeals,
        prefNewsletter: updatedUser.prefNewsletter,
        prefMarketing: updatedUser.prefMarketing,
        prefTheme: updatedUser.prefTheme,
        prefDefaultCountry: updatedUser.prefDefaultCountry,
        prefDefaultTherapeuticArea: updatedUser.prefDefaultTherapeuticArea,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    logger.error('Update preferences error:', { error: error });
    return res.status(500).json({ message: 'Internal server error during preferences update' });
  }
};
