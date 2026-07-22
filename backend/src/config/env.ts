import dotenv from 'dotenv';
import path from 'path';

// Load environmental parameters from the .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProd = process.env.NODE_ENV === 'production';

/**
 * Gets an environment variable, falling back to a development value if not in production.
 * Throws a critical configuration error if the variable is missing in a production environment.
 */
const getRequiredEnv = (key: string, devFallback: string): string => {
  const value = process.env[key];
  if (value) return value;
  
  if (isProd) {
    throw new Error(`CRITICAL CONFIGURATION ERROR: Environment variable "${key}" is required in production but was not provided.`);
  }
  
  return devFallback;
};

export const env = {
  DATABASE_URL: getRequiredEnv('DATABASE_URL', 'postgresql://postgres:Singhvivek321@localhost:5432/medtrackinsight?schema=public'),
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  JWT_ACCESS_SECRET: getRequiredEnv('JWT_ACCESS_SECRET', 'dev_jwt_access_secret_key_for_local_only'),
  JWT_REFRESH_SECRET: getRequiredEnv('JWT_REFRESH_SECRET', 'dev_jwt_refresh_secret_key_for_local_only'),
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholderkeyid',
  RAZORPAY_KEY_SECRET: getRequiredEnv('RAZORPAY_KEY_SECRET', 'dev_razorpay_key_secret_for_local_only'),
  ELASTICSEARCH_NODE: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  ELASTICSEARCH_INDEX: process.env.ELASTICSEARCH_INDEX || 'medicines',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@medtrack.com',
  RESEND_API_KEY: getRequiredEnv('RESEND_API_KEY', 're_placeholder_key'),
  RESEND_FROM: process.env.RESEND_FROM || 'MedTrackInsight <onboarding@resend.dev>',
};

// Quick startup verification to make sure required configurations exist
if (isProd && !process.env.DATABASE_URL) {
  throw new Error('CRITICAL CONFIGURATION ERROR: DATABASE_URL not set in production environment.');
}

