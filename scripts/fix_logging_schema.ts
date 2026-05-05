import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env at the very top
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function run() {
  // Dynamic import to ensure process.env is populated before the module initializes its client
  const { default: pool } = await import('../backend/src/utils/db');

  console.log('🚀 Running logging schema fix...');
  try {
    await pool.query('ALTER TABLE audit_logs ALTER COLUMN admin_id DROP NOT NULL');
    console.log('✅ ALTERED audit_logs: admin_id is now nullable.');
    await pool.query('ALTER TABLE audit_logs ALTER COLUMN action TYPE TEXT');
    console.log('✅ ALTERED audit_logs: action is now TEXT.');
  } catch (err: any) {
    console.error('❌ Failed to update schema:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
