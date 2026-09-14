import { Router } from 'express';
import healthRouter from './health';

import authRouter from './auth.routes';
import tripRouter from './trip.routes';
import userRouter from './user.routes';

const router = Router();

// Health check
router.use('/health', healthRouter);

// Authentication (Stage 2)
router.use('/auth', authRouter);

// Users (Stage 2/3)
router.use('/users', userRouter);

// Trips & Coordination (Stage 3)
router.use('/trips', tripRouter);

// Future route groups (Stage 5+)
// router.use('/checkins', checkinsRouter);
// router.use('/journal', journalRouter);

export default router;
