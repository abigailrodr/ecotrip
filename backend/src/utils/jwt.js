import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Generate JWT token for a user
 * @param {Object} user - User object with id, email, and role
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'user',
  };
  
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
