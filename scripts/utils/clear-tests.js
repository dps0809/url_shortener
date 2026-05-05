const { Pool } = require('pg');
const Redis = require('ioredis');
require('dotenv').config({ path: '.env.local' });

async function clearData() {
  console.log('Connecting to Postgres...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/url_shortener'
  });

  try {
    console.log('Truncating api_usage table...');
    await pool.query('TRUNCATE TABLE api_usage RESTART IDENTITY CASCADE;');

    console.log('Truncating urls table...');
    await pool.query('TRUNCATE TABLE urls RESTART IDENTITY CASCADE;');

    console.log('Connecting to Redis...');
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    console.log('Flushing Redis cache...');
    await redis.flushall();
    
    console.log('Disconnecting Redis...');
    await redis.quit();

    console.log('Done!');
  } catch (error) {
    console.error('Error during clear:', error);
  } finally {
    await pool.end();
  }
}

clearData().catch(console.error);
