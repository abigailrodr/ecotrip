import express from 'express';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/stats/dashboard
 * Get dashboard statistics for the authenticated user
 */
router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get user's aggregate statistics
    const stats = await User.getStats(userId);

    // Get carbon breakdown
    const carbonBreakdown = await Trip.getCarbonBreakdown(userId);

    res.json({
      total_trips: parseInt(stats.total_trips) || 0,
      total_carbon_kg: Math.round(parseFloat(stats.total_carbon_kg) * 100) / 100 || 0,
      total_spent: Math.round(parseFloat(stats.total_spent) * 100) / 100 || 0,
      avg_green_score: Math.round(parseFloat(stats.avg_green_score)) || 0,
      carbon_breakdown: {
        transport: Math.round(parseFloat(carbonBreakdown.transport) * 100) / 100 || 0,
        accommodation: Math.round(parseFloat(carbonBreakdown.accommodation) * 100) / 100 || 0,
        activities: Math.round(parseFloat(carbonBreakdown.activities) * 100) / 100 || 0,
      },
    });
  })
);

export default router;
