import { Router } from 'express';
import { body, param } from 'express-validator';
import { TravelMode, TripStatus, UserRole } from '@packleader/shared';
import { tripController } from '../controllers/trip.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// Require authentication for all trip operations
router.use(requireAuth);

const createTripValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Trip name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Trip name must be between 2 and 120 characters'),
  body('travelMode')
    .optional()
    .isIn(Object.values(TravelMode))
    .withMessage(`Travel mode must be one of: ${Object.values(TravelMode).join(', ')}`),
  body('origin.name')
    .optional()
    .trim(),
  body('destination.name')
    .optional()
    .trim(),
];

const joinTripValidation = [
  body('inviteCode')
    .trim()
    .notEmpty()
    .withMessage('Invite code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Invite code must be 6 characters long'),
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(TripStatus))
    .withMessage(`Status must be one of: ${Object.values(TripStatus).join(', ')}`),
];

const updateRoleValidation = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
  param('userId').isMongoId().withMessage('Invalid member user ID'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(Object.values(UserRole))
    .withMessage(`Role must be one of: ${Object.values(UserRole).join(', ')}`),
];

/**
 * @route   POST /api/trips
 * @desc    Create a new trip
 * @access  Private
 */
router.post(
  '/',
  validate(createTripValidation),
  asyncHandler(tripController.create.bind(tripController))
);

/**
 * @route   GET /api/trips
 * @desc    Get all trips the user belongs to
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(tripController.getMyTrips.bind(tripController))
);

/**
 * @route   POST /api/trips/join
 * @desc    Join a trip using a 6-character invite code
 * @access  Private
 */
router.post(
  '/join',
  validate(joinTripValidation),
  asyncHandler(tripController.joinByCode.bind(tripController))
);

/**
 * @route   GET /api/trips/:id
 * @desc    Get trip details by ID
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(tripController.getById.bind(tripController))
);

/**
 * @route   PATCH /api/trips/:id/status
 * @desc    Update trip status (start/finish)
 * @access  Private (Leader only)
 */
router.patch(
  '/:id/status',
  validate(updateStatusValidation),
  asyncHandler(tripController.updateStatus.bind(tripController))
);

/**
 * @route   PATCH /api/trips/:id/members/:userId/role
 * @desc    Update a trip member's role
 * @access  Private (Leader only)
 */
router.patch(
  '/:id/members/:userId/role',
  validate(updateRoleValidation),
  asyncHandler(tripController.updateMemberRole.bind(tripController))
);

/**
 * @route   DELETE /api/trips/:id/members/:userId
 * @desc    Remove a member from a trip, or leave trip
 * @access  Private
 */
router.delete(
  '/:id/members/:userId',
  asyncHandler(tripController.removeMember.bind(tripController))
);

/**
 * @route   PUT /api/trips/:id
 * @desc    Update trip details (name, travelMode, route, timeline)
 * @access  Private (Leader only)
 */
router.put(
  '/:id',
  validate([param('id').isMongoId().withMessage('Invalid trip ID')]),
  asyncHandler(tripController.update.bind(tripController))
);

/**
 * @route   DELETE /api/trips/:id
 * @desc    Delete a trip
 * @access  Private (Leader only)
 */
router.delete(
  '/:id',
  validate([param('id').isMongoId().withMessage('Invalid trip ID')]),
  asyncHandler(tripController.delete.bind(tripController))
);

export default router;
