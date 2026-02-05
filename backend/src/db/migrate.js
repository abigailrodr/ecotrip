import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Run all migration files in order
 */
async function runMigrations() {
  try {
    logger.info('🚀 Starting database migrations...');
    
    // Read all SQL files from migrations directory
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Ensure migrations run in order
    
    if (files.length === 0) {
      logger.warn('No migration files found');
      return;
    }
    
    // Run each migration
    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`Running migration: ${file}`);
      await pool.query(sql);
      logger.info(`✓ Migration completed: ${file}`);
    }
    
    logger.info('✓ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;
