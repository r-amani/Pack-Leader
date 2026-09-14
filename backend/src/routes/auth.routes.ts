import { Router } from 'express';
import { body } from 'express-validator';
import { TravelMode } from '@packleader/shared';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// Validation chains
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('preferredTravelMode')
    .optional()
    .isIn(Object.values(TravelMode))
    .withMessage(`Preferred travel mode must be one of: ${Object.values(TravelMode).join(', ')}`),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post(
  '/register',
  validate(registerValidation),
  asyncHandler(authController.register.bind(authController))
);

/**
 * @route   POST /api/auth/login
 * @desc    Log in with email and password
 * @access  Public
 */
router.post(
  '/login',
  validate(loginValidation),
  asyncHandler(authController.login.bind(authController))
);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(authController.getMe.bind(authController))
);

/**
 * @route   POST /api/auth/logout
 * @desc    Log out the user session
 * @access  Public
 */
router.post(
  '/logout',
  asyncHandler(authController.logout.bind(authController))
);

export default router;
