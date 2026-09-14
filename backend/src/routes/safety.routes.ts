import { Router } from 'express';
import { safetyController } from '../controllers/safety.controller';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

/**
 * POST /api/safety/sos
 * Trigger emergency SOS beacon with GPS coordinates.
 */
router.post('/sos', requireAuth, asyncHandler(safetyController.triggerSos.bind(safetyController)));

/**
 * GET /api/safety/sos/active/:tripId
 * Get active SOS beacons for a trip.
 */
router.get(
  '/sos/active/:tripId',
  requireAuth,
  asyncHandler(safetyController.getActiveSos.bind(safetyController))
);

/**
 * PATCH /api/safety/sos/:id/resolve
 * Resolve an emergency beacon.
 */
router.patch(
  '/sos/:id/resolve',
  requireAuth,
  asyncHandler(safetyController.resolveSos.bind(safetyController))
);

export const safetyRoutes = router;
