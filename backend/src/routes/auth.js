import express from 'express';
import User from '../models/User.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { validate, registerSchema, loginSchema, profileUpdateSchema, passwordChangeSchema } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet requirements',
      errors: passwordValidation.errors,
    });
  }

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'user',
  });

  // Generate JWT token
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    access_token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}));

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if user is active
  if (!user.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Account has been deactivated. Please contact support.',
    });
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Generate JWT token
  const token = generateToken(user);

  res.json({
    success: true,
    message: 'Login successful',
    access_token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  });
}));

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, validate(profileUpdateSchema), asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  // If email is being updated, check if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use',
      });
    }
  }

  // Update user
  const updatedUser = await User.update(req.user.id, { name, email });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    },
  });
}));

/**
 * PUT /api/auth/password
 * Change user password
 */
router.put('/password', authenticate, validate(passwordChangeSchema), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password hash
  const user = await User.findByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'New password does not meet requirements',
      errors: passwordValidation.errors,
    });
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await User.updatePassword(req.user.id, newPasswordHash);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

export default router;
