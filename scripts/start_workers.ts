import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables before ANY other imports to fix hoisting issues
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Standalone Worker Process
 * This file allows running the BullMQ workers in a separate Node process,
 * isolated from Next.js HMR/Dev server interference.
 */

async function main() {
    console.log('\n--- 🚀 [Standalone Workers] STARTING ---');
    console.log(`REDIS_URL: ${process.env.REDIS_URL || 'redis://127.0.0.1:6379'}`);
    
    try {
        // Dynamic imports to ensure dotenv is fully loaded before worker modules initialize
        const { startAllWorkers } = await import('../backend/src/services/worker.service');
        const { scanWorker } = await import('../backend/src/workers/scan.worker');
        const { qrWorker } = await import('../backend/src/workers/qr.worker');
        const { analyticsWorker } = await import('../backend/src/workers/analytics.worker');
        const { maintenanceWorker } = await import('../backend/src/workers/maintenance.worker');
        const { linkCreationWorker } = await import('../backend/src/workers/linkCreation.worker');
        const { loggingWorker } = await import('../backend/src/workers/logging.worker');

        // Initialize repeatable jobs and maintenance schedule
        await startAllWorkers();

        console.log('✅ [Standalone Workers] All workers are UP and listening for jobs.');
        console.log('Press Ctrl+C to terminate.\n');
        
        // Keep the process alive
        process.stdin.resume();

        // Graceful shutdown
        const shutdown = async () => {
            console.log('\n--- 🛑 [Standalone Workers] SHUTTING DOWN ---');
            await Promise.all([
                scanWorker.close(),
                qrWorker.close(),
                analyticsWorker.close(),
                maintenanceWorker.close(),
                linkCreationWorker.close(),
                loggingWorker.close()
            ]);
            console.log('✅ Connections closed. Goodbye.');
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (err) {
        console.error('❌ [Standalone Workers] FATAL START ERROR:', err);
        process.exit(1);
    }
}

main();
