import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validated environment configuration.
 * All environment variables are loaded here — never read process.env directly elsewhere.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/packleader',

  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  },

  // Google Maps
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8081',

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  /** Whether the app is running in production */
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },

  /** Whether the app is running in development */
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  },
} as const;

/**
 * Validate that critical environment variables are set.
 * Logs warnings for missing optional vars; throws for missing required vars in production.
 */
export function validateEnvironment(): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!env.jwtSecret || env.jwtSecret === 'CHANGE_ME_TO_A_SECURE_RANDOM_STRING') {
    if (env.isProduction) {
      errors.push('JWT_SECRET must be set to a secure value in production');
    } else {
      warnings.push('JWT_SECRET is not set — using insecure default for development');
    }
  }

  if (!env.firebase.projectId) {
    warnings.push('FIREBASE_PROJECT_ID is not set — Firebase features will be disabled');
  }

  if (!env.googleMapsApiKey) {
    warnings.push('GOOGLE_MAPS_API_KEY is not set — Maps features will be limited');
  }

  warnings.forEach((w) => console.warn(`⚠️  ${w}`));

  if (errors.length > 0) {
    errors.forEach((e) => console.error(`❌ ${e}`));
    throw new Error('Environment validation failed. See errors above.');
  }
}
