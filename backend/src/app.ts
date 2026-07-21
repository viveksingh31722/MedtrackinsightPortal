import { env } from './config/env';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { logger } from './utils/logger';
import { authRoutes } from './routes/auth.routes';
import { medicineRoutes } from './routes/medicine.routes';
import { paymentRoutes } from './routes/payment.routes';
import { adminRoutes } from './routes/admin.routes';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { createOrder, verifyPayment } from './controllers/payment.controller';
import { authenticateJWT } from './middleware/auth.middleware';

const app = express();

// Configure HTTP request logger middleware streaming through Winston
const morganMiddleware = morgan(
  ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);
app.use(morganMiddleware);


// CORS concept: Cross-Origin Resource Sharing.
// Since our Next.js frontend runs on localhost:3000 and the Express backend runs on localhost:5000,
// we must explicitly configure CORS to allow requests from the frontend and support HTTP-only cookie credentials.
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true, // Allows cookies to be received and set cross-origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Trust proxy for rate limiting (first hop)
app.set('trust proxy', 1);

// Apply global rate limiting to all requests
app.use(generalLimiter);

// Built-in Express parsing middleware
app.use(express.json()); // Parses application/json body payloads
app.use(express.urlencoded({ extended: true })); // Parses urlencoded payloads
app.use(cookieParser()); // Parses Cookie headers and populates req.cookies

// Health-check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Mounting API Router Layers with specific auth rate limiter
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/payment', paymentRoutes);
app.post('/api/create-order', authenticateJWT, createOrder);
app.post('/api/verify-payment', authenticateJWT, verifyPayment);
app.use('/api/admin', adminRoutes);

// Catch-all 404 routing handler
app.use((req, res) => {
  res.status(404).json({ message: `Resource not found: ${req.method} ${req.url}` });
});

// Express global exception catcher
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled runtime server exception:', { error: err.stack || err.message || err });
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the application server.',
  });
});

export default app;
export { app };
