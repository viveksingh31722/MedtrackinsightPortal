import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRoutes } from './routes/auth.routes';
import { medicineRoutes } from './routes/medicine.routes';
import { paymentRoutes } from './routes/payment.routes';
import { adminRoutes } from './routes/admin.routes';
import { env } from './config/env';

const app = express();

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

// Built-in Express parsing middleware
app.use(express.json()); // Parses application/json body payloads
app.use(express.urlencoded({ extended: true })); // Parses urlencoded payloads
app.use(cookieParser()); // Parses Cookie headers and populates req.cookies

// Health-check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Mounting API Router Layers
app.use('/api/auth', authRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 routing handler
app.use((req, res) => {
  res.status(404).json({ message: `Resource not found: ${req.method} ${req.url}` });
});

// Express global exception catcher
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled runtime server exception:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the application server.',
  });
});

export default app;
export { app };
