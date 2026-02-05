import EmissionFactor from '../models/EmissionFactor.js';

/**
 * Carbon Emissions Calculation Service
 * Uses DEFRA emission factors to calculate carbon footprint
 */
class CarbonService {
  /**
   * Calculate transport emissions
   * @param {string} mode - Transport mode (e.g., 'car_average', 'train_national')
   * @param {number} distanceKm - Distance in kilometers
   * @returns {Promise<number>} Carbon emissions in kg CO2
   */
  static async calculateTransportEmissions(mode, distanceKm) {
    if (!mode || !distanceKm || distanceKm <= 0) {
      return 0;
    }

    try {
      // Map common transport modes to database sub_categories
      const modeMap = {
        'car': 'car_average',
        'train': 'train_national',
        'bus': 'bus_local',
        'flight': 'flight_medium_haul',
        'taxi': 'taxi_regular',
        'bicycle': 'bicycle',
        'walking': 'walking',
      };

      const subCategory = modeMap[mode.toLowerCase()] || mode;
      const factor = await EmissionFactor.findByCategoryAndSubCategory('transport', subCategory);

      if (!factor) {
        console.warn(`No emission factor found for transport mode: ${mode}, using default`);
        // Default to average car if not found
        const defaultFactor = await EmissionFactor.findByCategoryAndSubCategory('transport', 'car_average');
        return defaultFactor ? distanceKm * parseFloat(defaultFactor.factor_kg_per_unit) : distanceKm * 0.171;
      }

      return distanceKm * parseFloat(factor.factor_kg_per_unit);
    } catch (error) {
      console.error('Error calculating transport emissions:', error);
      return 0;
    }
  }

  /**
   * Calculate accommodation emissions
   * @param {string} type - Accommodation type (e.g., 'hotel_standard', 'hostel')
   * @param {number} nights - Number of nights
   * @returns {Promise<number>} Carbon emissions in kg CO2
   */
  static async calculateAccommodationEmissions(type, nights) {
    if (!type || !nights || nights <= 0) {
      return 0;
    }

    try {
      const factor = await EmissionFactor.findByCategoryAndSubCategory('accommodation', type);

      if (!factor) {
        console.warn(`No emission factor found for accommodation type: ${type}, using default`);
        // Default to standard hotel if not found
        const defaultFactor = await EmissionFactor.findByCategoryAndSubCategory('accommodation', 'hotel_standard');
        return defaultFactor ? nights * parseFloat(defaultFactor.factor_kg_per_unit) : nights * 20.9;
      }

      return nights * parseFloat(factor.factor_kg_per_unit);
    } catch (error) {
      console.error('Error calculating accommodation emissions:', error);
      return 0;
    }
  }

  /**
   * Calculate activity emissions
   * @param {string} activityType - Activity type (e.g., 'museum_indoor', 'restaurant_meal')
   * @param {number} count - Number of activities/visits
   * @returns {Promise<number>} Carbon emissions in kg CO2
   */
  static async calculateActivityEmissions(activityType, count = 1) {
    if (!activityType || count <= 0) {
      return 0;
    }

    try {
      // Map common activities to database sub_categories
      const activityMap = {
        'museum': 'museum_indoor',
        'restaurant': 'restaurant_meal',
        'cafe': 'cafe_snack',
        'shopping': 'shopping_mall',
        'hiking': 'outdoor_activity',
        'tour': 'tour_guided',
        'outdoor': 'outdoor_activity',
      };

      const subCategory = activityMap[activityType.toLowerCase()] || activityType;
      const factor = await EmissionFactor.findByCategoryAndSubCategory('activity', subCategory);

      if (!factor) {
        console.warn(`No emission factor found for activity: ${activityType}, using default`);
        // Default to generic outdoor activity
        return count * 1.5; // Average activity emissions
      }

      return count * parseFloat(factor.factor_kg_per_unit);
    } catch (error) {
      console.error('Error calculating activity emissions:', error);
      return 0;
    }
  }

  /**
   * Calculate total trip emissions
   * @param {Object} tripData - Trip data including itinerary
   * @returns {Promise<Object>} Breakdown of emissions
   */
  static async calculateTripEmissions(tripData) {
    let transportEmissions = 0;
    let accommodationEmissions = 0;
    let activityEmissions = 0;

    try {
      // Calculate accommodation emissions
      if (tripData.accommodation_preference && tripData.nights) {
        accommodationEmissions = await this.calculateAccommodationEmissions(
          tripData.accommodation_preference,
          tripData.nights
        );
      }

      // Calculate emissions from itinerary if available
      if (tripData.itinerary && tripData.itinerary.days) {
        for (const day of tripData.itinerary.days) {
          if (day.activities) {
            for (const activity of day.activities) {
              // Activity emissions
              if (activity.category) {
                activityEmissions += await this.calculateActivityEmissions(
                  activity.category,
                  1
                );
              }

              // Transport emissions between activities
              if (activity.transport_distance_km && activity.transport_mode) {
                transportEmissions += await this.calculateTransportEmissions(
                  activity.transport_mode,
                  activity.transport_distance_km
                );
              }
            }
          }
        }
      }

      // Calculate flight emissions if destination is far
      if (tripData.destination_distance_km && tripData.destination_distance_km > 100) {
        const flightMode = tripData.destination_distance_km > 3700 
          ? 'flight_long_haul' 
          : tripData.destination_distance_km > 500 
            ? 'flight_medium_haul' 
            : 'flight_short_haul';
        
        const roundTripDistance = tripData.destination_distance_km * 2;
        transportEmissions += await this.calculateTransportEmissions(flightMode, roundTripDistance);
      }

      const totalEmissions = transportEmissions + accommodationEmissions + activityEmissions;

      return {
        transport: Math.round(transportEmissions * 100) / 100,
        accommodation: Math.round(accommodationEmissions * 100) / 100,
        activities: Math.round(activityEmissions * 100) / 100,
        total: Math.round(totalEmissions * 100) / 100,
      };
    } catch (error) {
      console.error('Error calculating trip emissions:', error);
      return {
        transport: 0,
        accommodation: 0,
        activities: 0,
        total: 0,
      };
    }
  }

  /**
   * Calculate Green Score (0-100)
   * Higher score = more sustainable
   * @param {number} totalCarbonKg - Total carbon emissions in kg
   * @param {number} tripDays - Number of days in trip
   * @returns {number} Green score (0-100)
   */
  static calculateGreenScore(totalCarbonKg, tripDays) {
    if (!totalCarbonKg || !tripDays || tripDays <= 0) {
      return 0;
    }

    // Calculate average daily emissions
    const dailyEmissions = totalCarbonKg / tripDays;

    // Benchmark values (kg CO2 per day):
    // Excellent (eco-friendly): < 5 kg/day
    // Good: 5-15 kg/day
    // Average: 15-30 kg/day
    // High: 30-50 kg/day
    // Very High: > 50 kg/day

    let score;
    if (dailyEmissions < 5) {
      score = 100 - (dailyEmissions * 2); // 90-100 for very low emissions
    } else if (dailyEmissions < 15) {
      score = 90 - ((dailyEmissions - 5) * 4); // 50-90 for low emissions
    } else if (dailyEmissions < 30) {
      score = 50 - ((dailyEmissions - 15) * 2); // 20-50 for average emissions
    } else if (dailyEmissions < 50) {
      score = 20 - ((dailyEmissions - 30) * 0.5); // 10-20 for high emissions
    } else {
      score = Math.max(0, 10 - ((dailyEmissions - 50) * 0.2)); // 0-10 for very high
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get eco-friendly alternatives for transport
   * @param {string} currentMode - Current transport mode
   * @param {number} distanceKm - Distance in kilometers
   * @returns {Promise<Array>} Array of alternative transport options
   */
  static async getEcoAlternatives(currentMode, distanceKm) {
    const alternatives = [];

    try {
      const currentEmissions = await this.calculateTransportEmissions(currentMode, distanceKm);

      // Suggest alternatives based on distance
      const options = distanceKm < 500 
        ? ['train_national', 'bus_local', 'car_electric']
        : ['train_international', 'bus_coach'];

      for (const option of options) {
        const emissions = await this.calculateTransportEmissions(option, distanceKm);
        if (emissions < currentEmissions) {
          const savings = currentEmissions - emissions;
          const savingsPercent = Math.round((savings / currentEmissions) * 100);
          
          alternatives.push({
            mode: option,
            emissions_kg: emissions,
            savings_kg: Math.round(savings * 100) / 100,
            savings_percent: savingsPercent,
          });
        }
      }

      return alternatives.sort((a, b) => a.emissions_kg - b.emissions_kg);
    } catch (error) {
      console.error('Error getting eco alternatives:', error);
      return [];
    }
  }
}

export default CarbonService;
