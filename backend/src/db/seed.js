import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { hashPassword } from '../utils/password.js';

/**
 * DEFRA 2023 Emission Factors
 * Source: UK Government GHG Conversion Factors for Company Reporting
 */
const emissionFactors = [
  // TRANSPORT - Air Travel
  { category: 'transport', sub_category: 'flight_short_haul', factor_kg_per_unit: 0.255, unit: 'km', description: 'Short-haul flight (<500km)' },
  { category: 'transport', sub_category: 'flight_medium_haul', factor_kg_per_unit: 0.156, unit: 'km', description: 'Medium-haul flight (500-3700km)' },
  { category: 'transport', sub_category: 'flight_long_haul', factor_kg_per_unit: 0.195, unit: 'km', description: 'Long-haul flight (>3700km)' },
  { category: 'transport', sub_category: 'flight_domestic', factor_kg_per_unit: 0.255, unit: 'km', description: 'Domestic flight (average)' },
  
  // TRANSPORT - Rail
  { category: 'transport', sub_category: 'train_national', factor_kg_per_unit: 0.041, unit: 'km', description: 'National rail' },
  { category: 'transport', sub_category: 'train_international', factor_kg_per_unit: 0.006, unit: 'km', description: 'International rail (e.g., Eurostar)' },
  { category: 'transport', sub_category: 'train_light_rail', factor_kg_per_unit: 0.035, unit: 'km', description: 'Light rail and tram' },
  { category: 'transport', sub_category: 'train_underground', factor_kg_per_unit: 0.031, unit: 'km', description: 'Underground/Metro' },
  
  // TRANSPORT - Road
  { category: 'transport', sub_category: 'bus_local', factor_kg_per_unit: 0.105, unit: 'km', description: 'Local bus' },
  { category: 'transport', sub_category: 'bus_coach', factor_kg_per_unit: 0.028, unit: 'km', description: 'Coach/long-distance bus' },
  { category: 'transport', sub_category: 'car_small', factor_kg_per_unit: 0.142, unit: 'km', description: 'Small car (petrol)' },
  { category: 'transport', sub_category: 'car_medium', factor_kg_per_unit: 0.171, unit: 'km', description: 'Medium car (petrol)' },
  { category: 'transport', sub_category: 'car_large', factor_kg_per_unit: 0.209, unit: 'km', description: 'Large car (petrol)' },
  { category: 'transport', sub_category: 'car_average', factor_kg_per_unit: 0.171, unit: 'km', description: 'Average car (all fuels)' },
  { category: 'transport', sub_category: 'car_electric', factor_kg_per_unit: 0.047, unit: 'km', description: 'Electric car' },
  { category: 'transport', sub_category: 'taxi_regular', factor_kg_per_unit: 0.211, unit: 'km', description: 'Regular taxi' },
  { category: 'transport', sub_category: 'taxi_black_cab', factor_kg_per_unit: 0.225, unit: 'km', description: 'Black cab (London)' },
  { category: 'transport', sub_category: 'motorcycle_small', factor_kg_per_unit: 0.084, unit: 'km', description: 'Motorcycle (small)' },
  { category: 'transport', sub_category: 'motorcycle_large', factor_kg_per_unit: 0.135, unit: 'km', description: 'Motorcycle (large)' },
  
  // TRANSPORT - Other
  { category: 'transport', sub_category: 'ferry_foot', factor_kg_per_unit: 0.019, unit: 'km', description: 'Ferry (foot passenger)' },
  { category: 'transport', sub_category: 'ferry_car', factor_kg_per_unit: 0.129, unit: 'km', description: 'Ferry (car passenger)' },
  { category: 'transport', sub_category: 'bicycle', factor_kg_per_unit: 0.0, unit: 'km', description: 'Bicycle (zero emissions)' },
  { category: 'transport', sub_category: 'walking', factor_kg_per_unit: 0.0, unit: 'km', description: 'Walking (zero emissions)' },
  
  // ACCOMMODATION
  { category: 'accommodation', sub_category: 'hotel_budget', factor_kg_per_unit: 15.2, unit: 'night', description: 'Budget hotel (1-3 stars)' },
  { category: 'accommodation', sub_category: 'hotel_standard', factor_kg_per_unit: 20.9, unit: 'night', description: 'Standard hotel (3-4 stars)' },
  { category: 'accommodation', sub_category: 'hotel_luxury', factor_kg_per_unit: 35.5, unit: 'night', description: 'Luxury hotel (5 stars)' },
  { category: 'accommodation', sub_category: 'hostel', factor_kg_per_unit: 8.5, unit: 'night', description: 'Hostel/budget accommodation' },
  { category: 'accommodation', sub_category: 'eco_lodge', factor_kg_per_unit: 5.2, unit: 'night', description: 'Eco-lodge/green hotel' },
  { category: 'accommodation', sub_category: 'airbnb', factor_kg_per_unit: 12.5, unit: 'night', description: 'Airbnb/vacation rental' },
  { category: 'accommodation', sub_category: 'camping', factor_kg_per_unit: 2.5, unit: 'night', description: 'Camping/outdoor accommodation' },
  
  // ACTIVITIES
  { category: 'activity', sub_category: 'museum_indoor', factor_kg_per_unit: 2.0, unit: 'visit', description: 'Museum/gallery visit' },
  { category: 'activity', sub_category: 'outdoor_activity', factor_kg_per_unit: 0.5, unit: 'activity', description: 'Outdoor activity (hiking, etc.)' },
  { category: 'activity', sub_category: 'restaurant_meal', factor_kg_per_unit: 3.5, unit: 'meal', description: 'Restaurant meal (average)' },
  { category: 'activity', sub_category: 'fast_food_meal', factor_kg_per_unit: 2.1, unit: 'meal', description: 'Fast food meal' },
  { category: 'activity', sub_category: 'cafe_snack', factor_kg_per_unit: 0.8, unit: 'visit', description: 'Cafe/snack' },
  { category: 'activity', sub_category: 'shopping_mall', factor_kg_per_unit: 1.0, unit: 'visit', description: 'Shopping mall visit' },
  { category: 'activity', sub_category: 'entertainment_venue', factor_kg_per_unit: 1.5, unit: 'visit', description: 'Entertainment venue (cinema, theater)' },
  { category: 'activity', sub_category: 'theme_park', factor_kg_per_unit: 8.5, unit: 'visit', description: 'Theme park/amusement park' },
  { category: 'activity', sub_category: 'spa_wellness', factor_kg_per_unit: 4.2, unit: 'visit', description: 'Spa/wellness center' },
  { category: 'activity', sub_category: 'water_sports', factor_kg_per_unit: 6.5, unit: 'activity', description: 'Water sports (motorized)' },
  { category: 'activity', sub_category: 'tour_guided', factor_kg_per_unit: 3.0, unit: 'tour', description: 'Guided tour (walking)' },
];

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    logger.info(' Starting database seeding...');
    
    await client.query('BEGIN');
    
    // 1. Seed emission factors
    logger.info('Seeding emission factors...');
    for (const factor of emissionFactors) {
      await client.query(
        `INSERT INTO emission_factors (category, sub_category, factor_kg_per_unit, unit, description, source)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (category, sub_category) DO UPDATE
         SET factor_kg_per_unit = EXCLUDED.factor_kg_per_unit,
             unit = EXCLUDED.unit,
             description = EXCLUDED.description,
             updated_at = CURRENT_TIMESTAMP`,
        [factor.category, factor.sub_category, factor.factor_kg_per_unit, factor.unit, factor.description, 'DEFRA 2023']
      );
    }
    logger.info(`✓ Seeded ${emissionFactors.length} emission factors`);
    
    // 2. Create a default admin user 
    logger.info('Creating default admin user...');
    const adminEmail = 'admin@ecotrip.com';
    const adminPassword = 'Admin123'; // !
    const adminPasswordHash = await hashPassword(adminPassword);
    
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingAdmin.rows.length === 0) {
      await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)`,
        ['Admin User', adminEmail, adminPasswordHash, 'admin']
      );
      logger.info(`✓ Created admin user: ${adminEmail} / ${adminPassword}`);
      logger.warn('  IMPORTANT: Change the admin password immediately!');
    } else {
      logger.info('Admin user already exists, skipping...');
    }
    
    // 3. Create a test regular user
    logger.info('Creating test user...');
    const testEmail = 'test@example.com';
    const testPassword = 'Test123';
    const testPasswordHash = await hashPassword(testPassword);
    
    const existingTest = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [testEmail]
    );
    
    if (existingTest.rows.length === 0) {
      await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)`,
        ['Test User', testEmail, testPasswordHash, 'user']
      );
      logger.info(`✓ Created test user: ${testEmail} / ${testPassword}`);
    } else {
      logger.info('Test user already exists, skipping...');
    }
    
    await client.query('COMMIT');
    logger.info('✓ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
