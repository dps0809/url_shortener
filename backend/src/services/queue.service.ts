import { scanQueue, scanQueueEvents, ScanQueueJobData } from '../queues/scan.queue';
import { linkCreationQueue, linkCreationQueueEvents, LinkCreationQueueJobData } from '../queues/linkCreation.queue';
import { qrQueue, QRQueueJobData } from '../queues/qr.queue';
import { analyticsQueue, AnalyticsJobData, AnalyticsClickJobData, AnalyticsSetupJobData } from '../queues/analytics.queue';
import { maintenanceQueue, maintenanceQueueEvents, MaintenanceQueueJobData } from '../queues/maintenance.queue';
import { loggingQueue, LoggingQueueJobData } from '../queues/logging.queue';

export {
  scanQueue,
  scanQueueEvents,
  linkCreationQueue,
  linkCreationQueueEvents,
  qrQueue,
  analyticsQueue,
  maintenanceQueue,
  maintenanceQueueEvents,
  loggingQueue
};

export type {
  ScanQueueJobData,
  LinkCreationQueueJobData,
  QRQueueJobData,
  AnalyticsJobData,
  AnalyticsClickJobData,
  AnalyticsSetupJobData,
  MaintenanceQueueJobData,
  LoggingQueueJobData
};

// Helper Enqueuers
export const enqueueScanJob = async (data: ScanQueueJobData) => {
  return await scanQueue.add('scan', data);
};

export const enqueueLinkCreationJob = async (data: LinkCreationQueueJobData) => {
  return await linkCreationQueue.add('create', data);
};

export const enqueueQRGeneration = async (data: QRQueueJobData) => {
  await qrQueue.add('generate', data);
};

export const enqueueAnalyticsSync = async (data: AnalyticsClickJobData) => {
  await analyticsQueue.add('click', data);
};

export const enqueueAnalyticsSetup = async (data: AnalyticsSetupJobData) => {
  await analyticsQueue.add('setup', data);
};

export const enqueueLogging = async (data: LoggingQueueJobData) => {
  await loggingQueue.add('log', data);
};

export const enqueueMaintenanceJob = async (data: MaintenanceQueueJobData) => {
  await maintenanceQueue.add(data.task, data);
};

export const enqueueMalwareScan = async (urlId: number, originalUrl: string) => {
  await maintenanceQueue.add('malware_scan', { task: 'malware_scan', urlId, originalUrl });
};

// Legacy Aliases
export const scanJobQueue = scanQueue;
export const qrGenerationQueue = qrQueue;
export const analyticsSyncQueue = analyticsQueue;
