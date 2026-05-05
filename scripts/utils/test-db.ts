
import pool from './backend/src/utils/db';

async function testDb() {
  try {
    const res = await pool.query('SELECT NOW() as time, current_database() as db');
    console.log('âœ… DATABASE IS RUNNING GOOD!');
    console.log(`Connected to: ${res.rows[0].db}`);
    console.log(`Current DB Time: ${res.rows[0].time}`);
    process.exit(0);
  } catch (err) {
    console.error('âŒ DATABASE CONNECTION FAILED:', err);
    process.exit(1);
  }
}

testDb();

