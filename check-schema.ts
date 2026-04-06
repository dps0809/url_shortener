import pool from './backend/src/utils/db';

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'urls' AND column_name = 'short_code'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
    process.exit(0);
  }
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
