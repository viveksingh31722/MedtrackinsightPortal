import rateLimit from 'express-rate-limit';

/**
 * General Rate Limiter:
 * Restricts all API endpoints to a maximum of 100 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs for live search & autocomplete
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    return process.env.NODE_ENV !== 'production' || ip.includes('127.0.0.1') || ip.includes('::1');
  },
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

/**
 * Authentication Rate Limiter:
 * Restricts authentication routes (login, register, reset, verification) to 15 attempts per 15 minutes per IP.
 * Protects against credential stuffing and brute-force verification bypass.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 auth attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login or verification attempts. Please try again after 15 minutes.'
  }
});
