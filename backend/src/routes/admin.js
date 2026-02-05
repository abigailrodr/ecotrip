import express from 'express';
import User from '../models/User.js';
import EmissionFactor from '../models/EmissionFactor.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import Trip from '../models/Trip.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, emissionFactorSchema } from '../utils/validators.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/users
 * Get all users with pagination and search
 */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, search = '' } = req.query;

    const result = await User.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
    });

    // Log admin action
    await AdminAuditLog.create({
      adminUserId: req.user.id,
      action: 'VIEW_USERS',
      targetResource: 'users',
      details: { search, limit, offset },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(result);
  })
);

/**
 * GET /api/admin/users/:id
 * Get a specific user with their trip history
 */
router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const trips = await Trip.findByUserId(userId);
    const stats = await User.getStats(userId);

    // Log admin action
    await AdminAuditLog.create({
      adminUserId: req.user.id,
      action: 'VIEW_USER_DETAILS',
      targetResource: 'users',
      targetId: userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      stats,
      trips: trips.length,
    });
  })
);

/**
 * PUT /api/admin/users/:id
 * Update user (activate/deactivate, change role)
 */
router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { is_active, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deactivating themselves
    if (userId === req.user.id && is_active === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    // Update user status if provided
    let updatedUser = user;
    if (is_active !== undefined) {
      updatedUser = await User.updateStatus(userId, is_active);
    }

    // Log admin action
    await AdminAuditLog.create({
      adminUserId: req.user.id,
      action: 'UPDATE_USER',
      targetResource: 'users',
      targetId: userId,
      details: { is_active, role, previous_is_active: user.is_active },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  })
);

/**
 * DELETE /api/admin/users/:id
 * Delete a user account (hard delete)
 */
router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Delete user (cascade will handle trips)
    await User.delete(userId);

    // Log admin action
    await AdminAuditLog.create({
      adminUserId: req.user.id,
      action: 'DELETE_USER',
      targetResource: 'users',
      targetId: userId,
      details: { deleted_user_email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  })
);

// ============================================
// EMISSION FACTOR MANAGEMENT
// ============================================

/**
 * GET /api/admin/emission-factors
 * Get all emission factors with filtering
 */
router.get(
  '/emission-factors',
  asyncHandler(async (req, res) => {
    const { category, is_active, limit = 100, offset = 0 } = req.query;

    const result = await EmissionFactor.findAll({
      category,
      isActive: is_active !== undefined ? is_active === 'true' : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json(result);
  })
);

/**
 * GET /api/admin/emission-factors/:id
 * Get a specific emission factor
 */
router.get(
  '/emission-factors/:id',
  asyncHandler(async (req, res) => {
    const factorId = parseInt(req.params.id);

    const factor = await EmissionFactor.findById(factorId);
    if (!factor) {
      return res.status(404).json({
        success: false,
        message: 'Emission factor not found',
      });
    }

    res.json(factor);
  })
);

/**
 * POST /api/admin/emission-factors
 * Create a new emission factor
 */
router.post(
  '/emission-factors',
  validate(emissionFactorSchema),
  asyncHandler(async (req, res) => {
    const { category, sub_category, factor_kg_per_unit, unit, source, description } = req.body;

    const factor = await EmissionFactor.create({
      category,
      subCategory: sub_category,
      factorKgPerUnit: factor_kg_per_unit,
      unit,
      source,
      description,
    });

    // Log admin action
    await AdminAuditLog.create({
      adminUserId: req.user.id,
      action: 'CREATE_EMISSION_FACTOR',
      targetResource: 'emission_factors',
      targetId: factor.id,
      details: { category, sub_category },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Emission factor created successfully',
      factor,
    });
  })
);

/**
 * PUT /api/admin/emission-factors/:id
 * Update an emission factor
 */
router.put(
  '/emission-factors/:id',
  asyncHandler(async (req, res) => {
    const factorId = parseInt(req.params.id);
    const updates = req.body;

    const existingFactor = await EmissionFactor.findById(factorId);
    if (!existingFactor) {
      return res.status(404).json({
        success: false,
        message: 'Emission factor not found',
      });
    }

    // Convert camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.sub_category) dbUpdates.subCategory = updates.sub_category;
    if (updates.factor_kg_per_unit) dbUpdates.factorKgPerUnit = updates.factor_kg_per_unit;
    if (updates.unit) dbUpdates.unit = updates.unit;
    if (updates.source) dbUpdates.source = updates.source;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.is_active !== undefined) dbUpdates.isActive = updates.is_active;

    const factor = await EmissionFactor.update(factorId, dbUpdates);

    // Log admin action
    await AdminAuditLog.create({
      adminUserId: req.user.id,
      action: 'UPDATE_EMISSION_FACTOR',
      targetResource: 'emission_factors',
      targetId: factorId,
      details: { updates, previous: existingFactor },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Emission factor updated successfully',
      factor,
    });
  })
);

/**
 * DELETE /api/admin/emission-factors/:id
 * Delete an emission factor (hard delete)
 */
router.delete(
  '/emission-factors/:id',
  asyncHandler(async (req, res) => {
    const factorId = parseInt(req.params.id);

    const factor = await EmissionFactor.findById(factorId);
    if (!factor) {
      return res.status(404).json({
        success: false,
        message: 'Emission factor not found',
      });
    }

    await EmissionFactor.delete(factorId);

    // Log admin action
    await AdminAuditLog.create({
      adminUserId: req.user.id,
      action: 'DELETE_EMISSION_FACTOR',
      targetResource: 'emission_factors',
      targetId: factorId,
      details: { deleted_factor: factor },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Emission factor deleted successfully',
    });
  })
);

// ============================================
// AUDIT LOGS
// ============================================

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 */
router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const { admin_user_id, action, target_resource, start_date, end_date, limit = 50, offset = 0 } = req.query;

    const result = await AdminAuditLog.findAll({
      adminUserId: admin_user_id ? parseInt(admin_user_id) : undefined,
      action,
      targetResource: target_resource,
      startDate: start_date,
      endDate: end_date,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json(result);
  })
);

export default router;
