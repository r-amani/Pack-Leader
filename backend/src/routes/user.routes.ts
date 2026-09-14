import { Router } from 'express';
import { body, param } from 'express-validator';
import { TravelMode } from '@packleader/shared';
import { userController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// Require auth for user profile endpoints
router.use(requireAuth);

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('preferredTravelMode')
    .optional()
    .isIn(Object.values(TravelMode))
    .withMessage(`Travel mode must be one of: ${Object.values(TravelMode).join(', ')}`),
  body('emergencyContacts')
    .optional()
    .isArray()
    .withMessage('Emergency contacts must be an array'),
];

/**
 * @route   GET /api/users/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', asyncHandler(userController.getMe.bind(userController)));

/**
 * @route   PUT /api/users/me
 * @desc    Update current authenticated user's profile
 * @access  Private
 */
router.put(
  '/me',
  validate(updateProfileValidation),
  asyncHandler(userController.updateProfile.bind(userController))
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate([param('id').isMongoId().withMessage('Invalid user ID')]),
  asyncHandler(userController.getProfile.bind(userController))
);

export default router;
