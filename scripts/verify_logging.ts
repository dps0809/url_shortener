import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function verify() {
    try {
        const { createShortUrl } = await import('../backend/src/services/url.service');
        
        console.log('--- Verification: Public URL Creation & Logging ---');
        const timestamp = Date.now();
        const url = `https://example.com/log-test-${timestamp}`;
        
        console.log(`Shortening: ${url}`);
        const result = await createShortUrl(url, null);
        console.log('✅ URL Created:', result.short_code);
        
        console.log('\nWaiting 3 seconds for logging worker to process...');
        await new Promise(r => setTimeout(r, 3000));
        
        console.log('\nVerification complete. Please check the worker logs for any [FAIL] messages.');
    } catch (err: any) {
        console.error('❌ Verification failed:', err);
    } finally {
        process.exit(0);
    }
}

verify();
