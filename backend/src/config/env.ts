import dotenv from 'dotenv';
import path from 'path';

// Load environmental parameters from the .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:Singhvivek321@localhost:5432/medtrackinsight?schema=public',
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'medtrack_access_token_secret_key_12345!',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'medtrack_refresh_token_secret_key_67890!',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholderkeyid',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'placeholdersecretkey',
  ELASTICSEARCH_NODE: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  ELASTICSEARCH_INDEX: process.env.ELASTICSEARCH_INDEX || 'medicines',
};

// Quick startup verification to make sure required configurations exist
if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL not set in environment. Falling back to default localhost Docker setup.');
}
