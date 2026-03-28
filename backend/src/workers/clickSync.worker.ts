import { redis } from '../utils/redis';
import pool from '../utils/db';

export async function syncClicksToDb() {
  let cursor = '0';
  const pattern = 'clicks:*';
  const batchSize = 100;

  try {
    do {
      // 1. read all clicks:* keys
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize);
      cursor = newCursor;

      if (keys.length === 0) continue;

      const pipeline = redis.pipeline();
      keys.forEach((key) => pipeline.get(key));
      const results = await pipeline.exec();

      if (!results) continue;

      const resetPipeline = redis.pipeline();

      // 2. batch update PostgreSQL
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const countStr = results[i][1] as string;
        const count = parseInt(countStr || '0', 10);

        if (count > 0) {
          const code = key.replace('clicks:', '');

          await pool.query(
            `UPDATE urls SET click_count = click_count + $1 WHERE "shortCode" = $2`,
            [count, code]
          );

          // 3. reset Redis counters
          resetPipeline.decrby(key, count);
        }
      }

      await resetPipeline.exec();
    } while (cursor !== '0');
    
    console.log('Click sync completed successfully.');
  } catch (error) {
    console.error('Error during click sync:', error);
  }
}
