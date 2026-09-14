import winston from 'winston';
import path from 'path';
import { env } from '../config/environment';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format for console output.
 */
const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
  const msg = stack || message;
  return `${ts} [${level}]: ${msg}`;
});

/**
 * Application logger.
 * - Console transport (always)
 * - File transport (production only)
 */
export const logger = winston.createLogger({
  level: env.isDevelopment ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  defaultMeta: { service: 'packleader-api' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
  ],
});

// Add file transports in production
if (env.isProduction) {
  logger.add(
    new winston.transports.File({
      filename: path.resolve(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5_242_880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.resolve(__dirname, '../../logs/combined.log'),
      maxsize: 5_242_880,
      maxFiles: 5,
    })
  );
}
