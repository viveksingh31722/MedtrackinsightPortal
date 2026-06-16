import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt';

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

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Verify if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    // Security concept: Hash passwords with bcrypt before saving to the database.
    // 10 salt rounds provides a strong balance between security and hash generation speed.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Create session payloads
    const payload: TokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      isSubscribed: newUser.isSubscribed,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: newUser.id, email: newUser.email });

    // Save refresh token to database
    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken },
    });

    // Set HTTP-Only cookies
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        isSubscribed: newUser.isSubscribed,
      },
      accessToken,
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
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare input password with hashed database password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
