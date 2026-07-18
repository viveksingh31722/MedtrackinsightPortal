import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// Express concept: We can extend the standard Request interface to include custom fields.
// In this case, we add the 'user' object so that subsequent controllers can access it.
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authentication Middleware:
 * Inspects incoming requests for a JSON Web Token.
 * Check order: 
 * 1. Authorization header (e.g., 'Bearer <token>')
 * 2. Cookie header named 'accessToken' (highly useful for SSR/Next.js)
 */
export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = '';

    // Check authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // Fallback: Check cookies (e.g. cookie-parser parses these)
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is missing' });
    }

    // Verify token validity
    const decoded = verifyAccessToken(token);
    
    // Attach decoded session details to req.user
    req.user = decoded;
    
    next(); // Pass control to the next middleware or controller function
  } catch (error) {
    logger.error('JWT verification error:', { error: error });
    return res.status(403).json({ message: 'Invalid or expired access token' });
  }
};
