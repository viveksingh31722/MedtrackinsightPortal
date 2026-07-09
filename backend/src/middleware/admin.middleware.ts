import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Admin Authorization Middleware:
 * Checks if the authenticated user has administrative privileges.
 * In this system, the admin is designated by the email 'admin@medtrack.com'.
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Administrator privileges required' });
    }

    next();
  } catch (error) {
    console.error('Admin verification middleware error:', error);
    return res.status(500).json({ message: 'Internal server verification error' });
  }
};
