import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 MEDTRACKINSIGHT API SERVER RUNNING`);
  console.log(`🔊 Listening on Port: ${env.PORT}`);
  console.log(`🌐 Frontend Allowed Origin: ${env.FRONTEND_URL}`);
  console.log(`🛠️ Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});

// Process termination signal catchers for graceful database client shutdowns
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Terminating API server process gracefully.');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT (Ctrl+C). Terminating API server process gracefully.');
  server.close(() => {
    process.exit(0);
  });
});
