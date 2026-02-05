import { query } from '../config/database.js';

/**
 * User model - handles all database operations for users
 */
class User {
  /**
   * Create a new user
   */
  static async create({ name, email, passwordHash, role = 'user' }) {
    const sql = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, is_active, created_at, updated_at
    `;
    const result = await query(sql, [name, email, passwordHash, role]);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const sql = `
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const sql = `
      SELECT id, name, email, password_hash, role, is_active, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  /**
   * Update user profile
   */
  static async update(id, { name, email }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, is_active, created_at, updated_at
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Update user password
   */
  static async updatePassword(id, passwordHash) {
    const sql = `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
      RETURNING id
    `;
    const result = await query(sql, [passwordHash, id]);
    return result.rows[0];
  }

  /**
   * Get all users (admin only)
   */
  static async findAll({ limit = 50, offset = 0, search = '' }) {
    let sql = `
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users
    `;
    const params = [];

    if (search) {
      sql += ` WHERE name ILIKE $1 OR email ILIKE $1`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    
    // Get total count
    const countSql = search
      ? `SELECT COUNT(*) FROM users WHERE name ILIKE $1 OR email ILIKE $1`
      : `SELECT COUNT(*) FROM users`;
    const countParams = search ? [`%${search}%`] : [];
    const countResult = await query(countSql, countParams);

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  }

  /**
   * Update user status (activate/deactivate)
   */
  static async updateStatus(id, isActive) {
    const sql = `
      UPDATE users
      SET is_active = $1
      WHERE id = $2
      RETURNING id, name, email, role, is_active, created_at, updated_at
    `;
    const result = await query(sql, [isActive, id]);
    return result.rows[0];
  }

  /**
   * Delete user (hard delete)
   */
  static async delete(id) {
    const sql = `DELETE FROM users WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Get user statistics
   */
  static async getStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_trips,
        COALESCE(SUM(total_carbon_kg), 0) as total_carbon_kg,
        COALESCE(SUM(total_cost), 0) as total_spent,
        COALESCE(AVG(green_score), 0) as avg_green_score
      FROM trips
      WHERE user_id = $1
    `;
    const result = await query(sql, [userId]);
    return result.rows[0];
  }
}

export default User;
