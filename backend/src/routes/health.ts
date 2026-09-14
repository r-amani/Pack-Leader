import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';
import { isFirebaseAvailable } from '../config/firebase';
import { sendSuccess } from '../utils/api-response';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint — returns server status and service connectivity.
 */
router.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
      firebase: isFirebaseAvailable() ? 'connected' : 'not configured',
    },
  });
});

export default router;
