import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function startServer() {
  console.log('🔌 Verifying database connection...');
  try {
    await prisma.$connect();
    console.log('✅ Database connection verified successfully.');

    const server = app.listen(env.PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 MEDTRACKINSIGHT API SERVER RUNNING`);
      console.log(`🔊 Listening on Port: ${env.PORT}`);
      console.log(`🌐 Frontend Allowed Origin: ${env.FRONTEND_URL}`);
      console.log(`🛠️ Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`==================================================`);
    });

    const shutdown = (signal: string) => {
      console.log(`Received ${signal}. Terminating API server process gracefully.`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log('🔌 Database client disconnected.');
        } catch (err) {
          console.error('Error disconnecting database client:', err);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Critical Database Connection Error:');
    console.error(error);
    console.error('API server startup failed due to database connectivity issue. Exiting.');
    process.exit(1);
  }
}

startServer();
