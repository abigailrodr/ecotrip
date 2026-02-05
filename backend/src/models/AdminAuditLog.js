import { query } from '../config/database.js';

/**
 * AdminAuditLog model - tracks admin actions
 */
class AdminAuditLog {
  /**
   * Create a new audit log entry
   */
  static async create({
    adminUserId,
    action,
    targetResource,
    targetId,
    details,
    ipAddress,
    userAgent,
  }) {
    const sql = `
      INSERT INTO admin_audit_log (
        admin_user_id, action, target_resource, target_id,
        details, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await query(sql, [
      adminUserId,
      action,
      targetResource,
      targetId,
      JSON.stringify(details),
      ipAddress,
      userAgent,
    ]);
    return result.rows[0];
  }

  /**
   * Get audit logs with filters
   */
  static async findAll({
    adminUserId,
    action,
    targetResource,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = {}) {
    let sql = `
      SELECT 
        al.*,
        u.name as admin_name,
        u.email as admin_email
      FROM admin_audit_log al
      JOIN users u ON al.admin_user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (adminUserId) {
      sql += ` AND al.admin_user_id = $${paramCount++}`;
      params.push(adminUserId);
    }

    if (action) {
      sql += ` AND al.action = $${paramCount++}`;
      params.push(action);
    }

    if (targetResource) {
      sql += ` AND al.target_resource = $${paramCount++}`;
      params.push(targetResource);
    }

    if (startDate) {
      sql += ` AND al.created_at >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND al.created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    sql += ` ORDER BY al.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    
    // Get total count
    let countSql = `SELECT COUNT(*) FROM admin_audit_log WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;
    
    if (adminUserId) {
      countSql += ` AND admin_user_id = $${countParamCount++}`;
      countParams.push(adminUserId);
    }
    if (action) {
      countSql += ` AND action = $${countParamCount++}`;
      countParams.push(action);
    }
    if (targetResource) {
      countSql += ` AND target_resource = $${countParamCount++}`;
      countParams.push(targetResource);
    }
    if (startDate) {
      countSql += ` AND created_at >= $${countParamCount++}`;
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ` AND created_at <= $${countParamCount}`;
      countParams.push(endDate);
    }
    
    const countResult = await query(countSql, countParams);

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    };
  }
}

export default AdminAuditLog;
