import openaiService from './openaiService.js';
import googlePlacesService from './googlePlacesService.js';
import CarbonService from './carbonService.js';
import { differenceInDays } from 'date-fns';

/**
 * Itinerary Service - Orchestrates trip generation
 * Combines OpenAI, Google Places, and Carbon calculation services
 */
class ItineraryService {
  /**
   * Generate a complete trip itinerary with carbon calculations
   * @param {Object} tripData - Trip planning data
   * @returns {Promise<Object>} Complete trip with itinerary and emissions
   */
  async generateTrip(tripData) {
    try {
      // Step 1: Geocode destination to get coordinates (optional - skip if API fails)
      console.log('Step 1: Geocoding destination...');
      let locationData = null;
      try {
        locationData = await googlePlacesService.geocodeDestination(tripData.destination);
      } catch (error) {
        console.warn('Geocoding failed, continuing without location data:', error.message);
        // Use fallback location data
        locationData = {
          formatted_address: tripData.destination,
          latitude: 0,
          longitude: 0,
          place_id: null,
        };
      }

      // Step 2: Generate AI itinerary
      console.log('Step 2: Generating AI itinerary...');
      const itinerary = await openaiService.generateItinerary(tripData);

      // Step 3: Enhance itinerary with real place data
      console.log('Step 3: Enhancing with place data...');
      const enhancedItinerary = await this.enhanceItineraryWithPlaceData(
        itinerary,
        locationData
      );

      // Step 4: Calculate carbon emissions
      console.log('Step 4: Calculating carbon emissions...');
      const numDays = differenceInDays(new Date(tripData.end_date), new Date(tripData.start_date)) + 1;
      
      const emissions = await CarbonService.calculateTripEmissions({
        accommodation_preference: tripData.accommodation_preference,
        nights: numDays,
        itinerary: enhancedItinerary,
        destination_distance_km: 0, // Can be enhanced with user's home location
      });

      // Step 5: Calculate green score
      const greenScore = CarbonService.calculateGreenScore(emissions.total, numDays);

      // Step 6: Calculate total cost from itinerary
      const totalCost = this.calculateTotalCost(enhancedItinerary);

      // Step 7: Store carbon breakdown in itinerary
      enhancedItinerary.transport_carbon = emissions.transport;
      enhancedItinerary.accommodation_carbon = emissions.accommodation;
      enhancedItinerary.activities_carbon = emissions.activities;

      return {
        itinerary: enhancedItinerary,
        location: locationData,
        total_carbon_kg: emissions.total,
        total_cost: totalCost,
        green_score: greenScore,
        carbon_breakdown: emissions,
      };
    } catch (error) {
      console.error('Error generating trip:', error);
      throw error;
    }
  }

  /**
   * Enhance itinerary with real place data from Google Places
   */
  async enhanceItineraryWithPlaceData(itinerary, locationData) {
    // For now, we'll keep the AI-generated data as is
    // This can be enhanced to search for real places and add photos, ratings, etc.
    
    // Add location coordinates to itinerary
    itinerary.destination_coordinates = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    };

    // You can add more enhancements here:
    // - Search for real restaurants and add ratings
    // - Add photos from Google Places
    // - Verify locations and add place IDs
    // - Get real-time opening hours

    return itinerary;
  }

  /**
   * Calculate total cost from itinerary
   */
  calculateTotalCost(itinerary) {
    if (!itinerary.days || !Array.isArray(itinerary.days)) {
      return 0;
    }

    let total = 0;
    for (const day of itinerary.days) {
      if (day.activities && Array.isArray(day.activities)) {
        for (const activity of day.activities) {
          total += activity.cost || 0;
        }
      }
      total += day.daily_cost || 0;
    }

    return Math.round(total * 100) / 100;
  }

  /**
   * Get eco-friendly recommendations for a destination
   */
  async getEcoRecommendations(destination) {
    try {
      const locationData = await googlePlacesService.geocodeDestination(destination);
      
      // Search for eco-friendly places
      const ecoPlaces = await googlePlacesService.searchPlaces(
        locationData.latitude,
        locationData.longitude,
        'park', // Natural areas
        10000
      );

      return {
        eco_attractions: ecoPlaces.slice(0, 5),
        sustainability_tips: [
          'Use public transportation whenever possible',
          'Stay in eco-certified accommodations',
          'Support local businesses and artisans',
          'Bring a reusable water bottle and shopping bag',
          'Choose walking or cycling tours over motorized transport',
        ],
      };
    } catch (error) {
      console.error('Error getting eco recommendations:', error);
      return {
        eco_attractions: [],
        sustainability_tips: [],
      };
    }
  }

  /**
   * Recalculate emissions for a modified itinerary
   */
  async recalculateEmissions(itinerary, numDays, accommodationType) {
    const emissions = await CarbonService.calculateTripEmissions({
      accommodation_preference: accommodationType,
      nights: numDays,
      itinerary: itinerary,
    });

    const greenScore = CarbonService.calculateGreenScore(emissions.total, numDays);

    return {
      total_carbon_kg: emissions.total,
      green_score: greenScore,
      carbon_breakdown: emissions,
    };
  }
}

// Export singleton instance
export default new ItineraryService();
