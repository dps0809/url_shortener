import { query } from '../backend/src/utils/db';

async function migrate() {
  console.log('Starting Authentication System Migration...');

  try {
    // 1. Clear the users table
    console.log('Clearing users table...');
    await query('TRUNCATE TABLE users CASCADE');

    // 2. Clear other related tables that might have FKs if they exist
    // (Assuming CASCADE handles it, but let's be safe if they aren't linked correctly)

    // 3. Alter users table
    console.log('Altering users table...');
    await query(`
      ALTER TABLE users 
      RENAME COLUMN user_id TO id;
    `);

    await query(`
      ALTER TABLE users 
      RENAME COLUMN password_h TO password_hash;
    `);

    // Add new columns
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS profile_image TEXT,
      ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'local',
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);

    // 4. Create otp_verifications table
    console.log('Creating otp_verifications table...');
    await query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
