import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { env } from './environment';

/**
 * Connect to MongoDB with retry logic.
 */
export async function connectDatabase(): Promise<void> {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('📦 MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    await mongoose.connect(env.mongodbUri, {
      // Mongoose 8 uses sensible defaults; only override if needed
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    logger.info('Retrying MongoDB connection in 5 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return connectDatabase();
  }
}

/**
 * Gracefully disconnect from MongoDB.
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}

/**
 * Check if the database is currently connected.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
