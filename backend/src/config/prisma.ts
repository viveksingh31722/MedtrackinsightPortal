import { PrismaClient } from '@prisma/client';

// PostgreSQL & Prisma concept: The PrismaClient handles the actual SQL connection pool.
// We should only instantiate it once across the application (singleton pattern).
// Creating too many PrismaClient instances can exhaust PostgreSQL's max_connections limit.
const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'], // Logs queries to terminal for debugging
});

export default prisma;
export { prisma };
