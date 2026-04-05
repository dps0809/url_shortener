/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js on server startup.
 * It initializes all BullMQ background workers and schedules maintenance jobs.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run on the server (Node.js runtime), not on Edge
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startAllWorkers } = await import(
      '@/backend/src/services/worker.service'
    );
    await startAllWorkers();
    console.log('🚀 All background workers started via instrumentation hook');
  }
}
