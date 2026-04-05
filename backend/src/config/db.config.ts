/**
 * Database Configuration
 * 
 * PostgreSQL connection settings.
 * The main pool singleton is in utils/db.ts.
 * This file exports configuration constants.
 */

export const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
