import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';

async function startServer() {
  logger.info('🔌 Verifying database connection...');
  try {
    await prisma.$connect();
    logger.info('✅ Database connection verified successfully.');

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 MEDTRACKINSIGHT API SERVER RUNNING - Listening on Port: ${env.PORT} - Mode: ${process.env.NODE_ENV || 'development'}`);
    });

    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Terminating API server process gracefully.`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          logger.info('🔌 Database client disconnected.');
        } catch (err) {
          logger.error('Error disconnecting database client:', { error: err });
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Critical Database Connection Error during server startup:', { error });
    process.exit(1);
  }
}

startServer();

