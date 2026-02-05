import Joi from 'joi';

// User registration validation
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required',
  }),
});

// User login validation
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Profile update validation
export const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
}).min(1); // At least one field must be present

// Password change validation
export const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

// Trip generation validation
export const tripGenerationSchema = Joi.object({
  destination: Joi.string().min(2).max(200).required().messages({
    'any.required': 'Destination is required',
    'string.min': 'Destination must be at least 2 characters',
  }),
  start_date: Joi.date().iso().min('now').required().messages({
    'any.required': 'Start date is required',
    'date.min': 'Start date must be in the future',
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
    'any.required': 'End date is required',
    'date.min': 'End date must be after start date',
  }),
  budget: Joi.number().min(0).max(1000000).required().messages({
    'any.required': 'Budget is required',
    'number.min': 'Budget must be positive',
  }),
  interests: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'At least one interest is required',
    'any.required': 'Interests are required',
  }),
  travel_style: Joi.string().valid('budget', 'balanced', 'luxury').required(),
  accommodation_preference: Joi.string().valid(
    'hostel',
    'hotel_budget',
    'hotel_standard',
    'eco_lodge',
    'airbnb'
  ).required(),
  transport_preference: Joi.string().valid('train', 'bus', 'car', 'mixed').required(),
});

// Emission factor validation
export const emissionFactorSchema = Joi.object({
  category: Joi.string().valid('transport', 'accommodation', 'activity').required(),
  sub_category: Joi.string().required(),
  factor_kg_per_unit: Joi.number().min(0).required(),
  unit: Joi.string().required(),
  source: Joi.string().optional(),
});

// Generic validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }
    
    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};
