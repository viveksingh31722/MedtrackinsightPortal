import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { prisma } from '../config/prisma';

/**
 * Subscription Verification Middleware:
 * Validates if the authenticated user has an active subscription.
 * Checks:
 * 1. User exists in the database.
 * 2. User's isSubscribed is true.
 * 3. User's subscriptionEnd is either null (lifetime/unlimited) or in the future.
 */
export const requireSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Lookup user in PostgreSQL database to verify their real-time subscription status
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify subscription status
    const now = new Date();
    const isSubscribed = user.isSubscribed;
    const hasNotExpired = !user.subscriptionEnd || new Date(user.subscriptionEnd) > now;

    if (!isSubscribed || !hasNotExpired) {
      return res.status(403).json({
        message: 'This resource requires an active Pro subscription. Please upgrade.',
        isSubscribed: false
      });
    }

    // User is authorized, pass control to controller
    next();
  } catch (error) {
    console.error('Subscription verification middleware error:', error);
    return res.status(500).json({ message: 'Internal server verification error' });
  }
};
