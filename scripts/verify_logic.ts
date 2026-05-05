import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function verify() {
    try {
        const { createShortUrl } = await import('../backend/src/services/url.service');
        
        console.log('--- TEST 1: Malicious URL ---');
        try {
            const badUrl = 'https://badsite.com';
            console.log(`Shortening: ${badUrl}`);
            await createShortUrl(badUrl, null);
            console.log('❌ FAIL: Malicious URL was not blocked!');
        } catch (err: any) {
            console.log(`✅ SUCCESS: Got expected error: ${err.message}`);
        }

        console.log('\n--- TEST 2: Safe URL ---');
        try {
            const timestamp = Date.now();
            const safeUrl = `https://www.google.com?t=${timestamp}`;
            console.log(`Shortening: ${safeUrl}`);
            const result = await createShortUrl(safeUrl, null);
            console.log('✅ SUCCESS: Created URL:', result.short_code);
            console.log('Full Record:', JSON.stringify(result, null, 2));
        } catch (err: any) {
            console.log('❌ FAIL: Safe URL was blocked or failed!');
            console.error(err);
        }

    } catch (err) {
        console.error('❌ Verification script crashed:', err);
    } finally {
        process.exit(0);
    }
}

verify();
