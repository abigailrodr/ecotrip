import { Client } from '@googlemaps/google-maps-services-js';
import config from '../config/env.js';

/**
 * Google Places and Maps Service
 * Handles geocoding, place searches, and distance calculations
 */
class GooglePlacesService {
  constructor() {
    this.client = new Client({});
    this.apiKey = config.apiKeys.googlePlaces;
  }

  /**
   * Geocode a destination (get coordinates from address)
   * @param {string} destination - Destination name or address
   * @returns {Promise<Object>} Location data with coordinates
   */
  async geocodeDestination(destination) {
    try {
      const response = await this.client.geocode({
        params: {
          address: destination,
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error(`Could not find location: ${destination}`);
      }

      const result = response.data.results[0];
      return {
        formatted_address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        place_id: result.place_id,
      };
    } catch (error) {
      console.error('Geocoding error:', error.message);
      throw new Error(`Failed to geocode destination: ${destination}`);
    }
  }

  /**
   * Search for places of interest near a location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {string} type - Place type (e.g., 'restaurant', 'museum', 'tourist_attraction')
   * @param {number} radius - Search radius in meters (default: 5000)
   * @returns {Promise<Array>} Array of places
   */
  async searchPlaces(latitude, longitude, type = 'tourist_attraction', radius = 5000) {
    try {
      const response = await this.client.placesNearby({
        params: {
          location: { lat: latitude, lng: longitude },
          radius,
          type,
          key: this.apiKey,
        },
      });

      return response.data.results.map(place => ({
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating,
        types: place.types,
        opening_hours: place.opening_hours,
      }));
    } catch (error) {
      console.error('Place search error:', error.message);
      return [];
    }
  }

  /**
   * Get place details
   * @param {string} placeId - Google Place ID
   * @returns {Promise<Object>} Detailed place information
   */
  async getPlaceDetails(placeId) {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: ['name', 'formatted_address', 'geometry', 'rating', 'opening_hours', 'photos', 'website'],
          key: this.apiKey,
        },
      });

      const place = response.data.result;
      return {
        place_id: placeId,
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry?.location.lat,
        longitude: place.geometry?.location.lng,
        rating: place.rating,
        website: place.website,
        opening_hours: place.opening_hours,
      };
    } catch (error) {
      console.error('Place details error:', error.message);
      return null;
    }
  }

  /**
   * Calculate distance and duration between two points
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @param {string} mode - Travel mode ('driving', 'walking', 'transit', 'bicycling')
   * @returns {Promise<Object>} Distance and duration data
   */
  async calculateDistance(origin, destination, mode = 'driving') {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [`${origin.lat},${origin.lng}`],
          destinations: [`${destination.lat},${destination.lng}`],
          mode,
          key: this.apiKey,
        },
      });

      if (response.data.rows.length === 0 || response.data.rows[0].elements.length === 0) {
        throw new Error('Could not calculate distance');
      }

      const element = response.data.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        throw new Error(`Distance calculation failed: ${element.status}`);
      }

      return {
        distance_meters: element.distance.value,
        distance_km: Math.round((element.distance.value / 1000) * 10) / 10,
        distance_text: element.distance.text,
        duration_seconds: element.duration.value,
        duration_minutes: Math.round(element.duration.value / 60),
        duration_text: element.duration.text,
        mode,
      };
    } catch (error) {
      console.error('Distance calculation error:', error.message);
      // Return default values if API fails
      return {
        distance_meters: 0,
        distance_km: 0,
        distance_text: 'Unknown',
        duration_seconds: 0,
        duration_minutes: 0,
        duration_text: 'Unknown',
        mode,
      };
    }
  }

  /**
   * Calculate distance from a reference point (e.g., user's location) to destination
   * Useful for calculating flight emissions
   * @param {string} fromLocation - Origin location name
   * @param {string} toLocation - Destination location name
   * @returns {Promise<number>} Distance in kilometers
   */
  async calculateFlightDistance(fromLocation, toLocation) {
    try {
      // Geocode both locations
      const origin = await this.geocodeDestination(fromLocation);
      const destination = await this.geocodeDestination(toLocation);

      // Calculate straight-line distance (as crow flies)
      const distance = this.calculateHaversineDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );

      return Math.round(distance);
    } catch (error) {
      console.error('Flight distance calculation error:', error.message);
      return 0;
    }
  }

  /**
   * Calculate haversine distance between two coordinates
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get popular attractions for a destination
   * @param {string} destination - Destination name
   * @param {number} limit - Maximum number of attractions
   * @returns {Promise<Array>} Array of attractions
   */
  async getPopularAttractions(destination, limit = 10) {
    try {
      // First geocode the destination
      const location = await this.geocodeDestination(destination);

      // Search for tourist attractions
      const attractions = await this.searchPlaces(
        location.latitude,
        location.longitude,
        'tourist_attraction',
        10000 // 10km radius
      );

      // Sort by rating and limit
      return attractions
        .filter(a => a.rating)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching attractions:', error.message);
      return [];
    }
  }

  /**
   * Get restaurants near a location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} limit - Maximum number of restaurants
   * @returns {Promise<Array>} Array of restaurants
   */
  async getRestaurants(latitude, longitude, limit = 5) {
    try {
      const restaurants = await this.searchPlaces(
        latitude,
        longitude,
        'restaurant',
        2000 // 2km radius
      );

      return restaurants
        .filter(r => r.rating)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching restaurants:', error.message);
      return [];
    }
  }
}

// Export singleton instance
export default new GooglePlacesService();
