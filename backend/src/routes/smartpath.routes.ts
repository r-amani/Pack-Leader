import { Router } from 'express';
import { smartPathController } from '../controllers/smartpath.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/routes/smartpath/recommend
 * Returns smart route recommendations (fastest, scenic, twisty, convoy) with stops.
 */
router.post('/recommend', requireAuth, (req, res) =>
  smartPathController.getRecommendations(req, res)
);

export const smartPathRoutes = router;

