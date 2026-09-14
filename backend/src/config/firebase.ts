import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { env } from './environment';

let firebaseApp: admin.app.App | null = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK.
 * Gracefully handles missing credentials by logging a warning.
 */
export function initializeFirebase(): void {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Check if credentials are available
    if (env.firebase.serviceAccountPath) {
      // Option 1: Service account JSON file
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(env.firebase.serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('🔥 Firebase Admin initialized (service account file)');
    } else if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
      // Option 2: Individual credential env vars
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey,
        }),
      });
      logger.info('🔥 Firebase Admin initialized (env credentials)');
    } else {
      logger.warn(
        '⚠️  Firebase credentials not configured — Firebase features (push notifications, realtime DB) will be unavailable. ' +
          'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env to enable.'
      );
    }

    firebaseInitialized = true;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error);
    firebaseInitialized = true; // Prevent retry loops
  }
}

/**
 * Get the Firebase Admin app instance.
 * Returns null if Firebase is not configured.
 */
export function getFirebaseApp(): admin.app.App | null {
  return firebaseApp;
}

/**
 * Check if Firebase is available and initialized.
 */
export function isFirebaseAvailable(): boolean {
  return firebaseApp !== null;
}
