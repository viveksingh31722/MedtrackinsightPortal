import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  isSubscribed: boolean;
}

/**
 * JWT Concept: An Access Token is a short-lived token (15 mins) that the client
 * includes in API requests to prove their identity. A Refresh Token is a long-lived
 * token (7 days) stored securely in HTTP-only cookies, used to get a new Access Token
 * without forcing the user to log in again.
 */

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (payload: Omit<TokenPayload, 'isSubscribed'>): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): Omit<TokenPayload, 'isSubscribed'> => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as Omit<TokenPayload, 'isSubscribed'>;
};
