import { query } from '../config/database.js';

/**
 * Trip model - handles all database operations for trips
 */
class Trip {
  /**
   * Create a new trip
   */
  static async create({
    userId,
    destination,
    startDate,
    endDate,
    budget,
    interests,
    travelStyle,
    accommodationPreference,
    transportPreference,
    itinerary,
    totalCarbonKg,
    totalCost,
    greenScore,
  }) {
    const sql = `
      INSERT INTO trips (
        user_id, destination, start_date, end_date, budget, interests,
        travel_style, accommodation_preference, transport_preference,
        itinerary, total_carbon_kg, total_cost, green_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const result = await query(sql, [
      userId,
      destination,
      startDate,
      endDate,
      budget,
      JSON.stringify(interests),
      travelStyle,
      accommodationPreference,
      transportPreference,
      JSON.stringify(itinerary),
      totalCarbonKg,
      totalCost,
      greenScore,
    ]);
    return result.rows[0];
  }

  /**
   * Find trip by ID
   */
  static async findById(id) {
    const sql = `SELECT * FROM trips WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Find all trips for a user
   */
  static async findByUserId(userId, { limit = 50, offset = 0 } = {}) {
    const sql = `
      SELECT * FROM trips
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Update trip
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to snake_case
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount++}`);
        // Stringify JSON fields
        if (['interests', 'itinerary'].includes(dbKey)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE trips
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Delete trip
   */
  static async delete(id) {
    const sql = `DELETE FROM trips WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Get carbon breakdown for a user
   */
  static async getCarbonBreakdown(userId) {
    const sql = `
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN itinerary->>'transport_carbon' IS NOT NULL 
            THEN (itinerary->>'transport_carbon')::numeric 
            ELSE 0 
          END
        ), 0) as transport,
        COALESCE(SUM(
          CASE 
            WHEN itinerary->>'accommodation_carbon' IS NOT NULL 
            THEN (itinerary->>'accommodation_carbon')::numeric 
            ELSE 0 
          END
        ), 0) as accommodation,
        COALESCE(SUM(
          CASE 
            WHEN itinerary->>'activities_carbon' IS NOT NULL 
            THEN (itinerary->>'activities_carbon')::numeric 
            ELSE 0 
          END
        ), 0) as activities
      FROM trips
      WHERE user_id = $1
    `;
    const result = await query(sql, [userId]);
    return result.rows[0];
  }

  /**
   * Get all trips (admin only)
   */
  static async findAll({ limit = 50, offset = 0 } = {}) {
    const sql = `
      SELECT 
        t.*,
        u.name as user_name,
        u.email as user_email
      FROM trips t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await query(sql, [limit, offset]);
    
    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM trips`);
    
    return {
      trips: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  }
}

export default Trip;
