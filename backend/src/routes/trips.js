import express from 'express';
import Trip from '../models/Trip.js';
import itineraryService from '../services/itineraryService.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, tripGenerationSchema } from '../utils/validators.js';
import { tripGenerationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/trips/generate
 * Generate a new AI-powered trip itinerary
 */
router.post(
  '/generate',
  authenticate,
  tripGenerationLimiter,
  validate(tripGenerationSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const tripData = req.body;

    // Generate complete trip with AI, location data, and carbon calculations
    const generatedTrip = await itineraryService.generateTrip(tripData);

    // Save trip to database
    const trip = await Trip.create({
      userId,
      destination: tripData.destination,
      startDate: tripData.start_date,
      endDate: tripData.end_date,
      budget: tripData.budget,
      interests: tripData.interests,
      travelStyle: tripData.travel_style,
      accommodationPreference: tripData.accommodation_preference,
      transportPreference: tripData.transport_preference,
      itinerary: generatedTrip.itinerary,
      totalCarbonKg: generatedTrip.total_carbon_kg,
      totalCost: generatedTrip.total_cost,
      greenScore: generatedTrip.green_score,
    });

    res.status(201).json({
      success: true,
      message: 'Trip generated successfully',
      id: trip.id,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      budget: trip.budget,
      total_carbon_kg: trip.total_carbon_kg,
      total_cost: trip.total_cost,
      green_score: trip.green_score,
      itinerary: trip.itinerary,
      carbon_breakdown: generatedTrip.carbon_breakdown,
    });
  })
);

/**
 * GET /api/trips
 * Get all trips for the authenticated user
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const trips = await Trip.findByUserId(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json(
      trips.map(trip => ({
        id: trip.id,
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        budget: trip.budget,
        total_carbon_kg: parseFloat(trip.total_carbon_kg) || 0,
        total_cost: parseFloat(trip.total_cost) || 0,
        green_score: trip.green_score,
        created_at: trip.created_at,
      }))
    );
  })
);

/**
 * GET /api/trips/:id
 * Get a specific trip by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const tripId = req.params.id;
    const userId = req.user.id;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check if user owns this trip (or is admin)
    if (trip.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this trip',
      });
    }

    // Transform itinerary format for frontend compatibility
    // Frontend expects itinerary to be an array of days
    const itinerary = trip.itinerary?.days || trip.itinerary || [];
    
    res.json({
      id: trip.id,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      budget: parseFloat(trip.budget),
      interests: trip.interests,
      travel_style: trip.travel_style,
      accommodation_preference: trip.accommodation_preference,
      transport_preference: trip.transport_preference,
      itinerary: itinerary,
      total_carbon_kg: parseFloat(trip.total_carbon_kg) || 0,
      total_cost: parseFloat(trip.total_cost) || 0,
      green_score: trip.green_score,
      created_at: trip.created_at,
      updated_at: trip.updated_at,
    });
  })
);

/**
 * DELETE /api/trips/:id
 * Delete a trip
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const tripId = req.params.id;
    const userId = req.user.id;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check if user owns this trip (or is admin)
    if (trip.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this trip',
      });
    }

    await Trip.delete(tripId);

    res.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  })
);

/**
 * PUT /api/trips/:id
 * Update a trip (e.g., modify itinerary)
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const tripId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check if user owns this trip
    if (trip.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this trip',
      });
    }

    // Update trip
    const updatedTrip = await Trip.update(tripId, updates);

    res.json({
      success: true,
      message: 'Trip updated successfully',
      trip: updatedTrip,
    });
  })
);

export default router;
