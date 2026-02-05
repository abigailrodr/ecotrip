/**
 * Middleware to verify user has admin role
 * Must be used after authenticate middleware
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required. You do not have permission to access this resource.',
    });
  }
  
  next();
};
