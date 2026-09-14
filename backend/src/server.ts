import http from 'http';
import { createApp } from './app';
import { env, validateEnvironment } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeFirebase } from './config/firebase';
import { initializeSocket } from './socket';
import { logger } from './utils/logger';

/**
 * Bootstrap and start the Pack Leader API server.
 */
async function startServer(): Promise<void> {
  try {
    // Validate environment
    validateEnvironment();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    initializeSocket(httpServer);

    // Initialize Firebase (non-blocking)
    initializeFirebase();

    // Connect to MongoDB
    await connectDatabase();

    // Start listening
    httpServer.listen(env.port, () => {
      logger.info(`
╔══════════════════════════════════════════════╗
║          🐾 Pack Leader API Server           ║
╠══════════════════════════════════════════════╣
║  Environment: ${env.nodeEnv.padEnd(30)}║
║  Port:        ${String(env.port).padEnd(30)}║
║  API:         http://localhost:${String(env.port).padEnd(18)}║
║  Health:      http://localhost:${env.port}/api/health   ║
╚══════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
