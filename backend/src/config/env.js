import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8000,
  
  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'ecotrip',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // API Keys
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'GOOGLE_PLACES_API_KEY',
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0 && config.env !== 'test') {
  console.warn(
    ` Warning: Missing environment variables: ${missingEnvVars.join(', ')}`
  );
  console.warn('Please check your .env file');
}

export default config;
