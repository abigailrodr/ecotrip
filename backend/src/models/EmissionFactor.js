import { query } from '../config/database.js';

/**
 * EmissionFactor model - handles database operations for emission factors
 */
class EmissionFactor {
  /**
   * Create a new emission factor
   */
  static async create({
    category,
    subCategory,
    factorKgPerUnit,
    unit,
    source = 'DEFRA 2023',
    description,
  }) {
    const sql = `
      INSERT INTO emission_factors (
        category, sub_category, factor_kg_per_unit, unit, source, description
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await query(sql, [
      category,
      subCategory,
      factorKgPerUnit,
      unit,
      source,
      description,
    ]);
    return result.rows[0];
  }

  /**
   * Find emission factor by ID
   */
  static async findById(id) {
    const sql = `SELECT * FROM emission_factors WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Find emission factor by category and sub-category
   */
  static async findByCategoryAndSubCategory(category, subCategory) {
    const sql = `
      SELECT * FROM emission_factors
      WHERE category = $1 AND sub_category = $2 AND is_active = true
    `;
    const result = await query(sql, [category, subCategory]);
    return result.rows[0];
  }

  /**
   * Get all emission factors
   */
  static async findAll({ category, isActive = true, limit = 100, offset = 0 } = {}) {
    let sql = `
      SELECT * FROM emission_factors
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (category) {
      sql += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    if (isActive !== undefined) {
      sql += ` AND is_active = $${paramCount++}`;
      params.push(isActive);
    }

    sql += ` ORDER BY category, sub_category LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    
    // Get total count
    let countSql = `SELECT COUNT(*) FROM emission_factors WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;
    
    if (category) {
      countSql += ` AND category = $${countParamCount++}`;
      countParams.push(category);
    }
    if (isActive !== undefined) {
      countSql += ` AND is_active = $${countParamCount}`;
      countParams.push(isActive);
    }
    
    const countResult = await query(countSql, countParams);

    return {
      factors: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  }

  /**
   * Update emission factor
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      category: 'category',
      subCategory: 'sub_category',
      factorKgPerUnit: 'factor_kg_per_unit',
      unit: 'unit',
      source: 'source',
      description: 'description',
      isActive: 'is_active',
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && fieldMap[key]) {
        fields.push(`${fieldMap[key]} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE emission_factors
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Delete emission factor (soft delete)
   */
  static async deactivate(id) {
    const sql = `
      UPDATE emission_factors
      SET is_active = false
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Delete emission factor (hard delete)
   */
  static async delete(id) {
    const sql = `DELETE FROM emission_factors WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Get all categories
   */
  static async getCategories() {
    const sql = `
      SELECT DISTINCT category
      FROM emission_factors
      WHERE is_active = true
      ORDER BY category
    `;
    const result = await query(sql);
    return result.rows.map(row => row.category);
  }
}

export default EmissionFactor;
