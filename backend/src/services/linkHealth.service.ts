import { getActiveUrls } from '../models/url.model';
import { query } from '../utils/db';

export const checkLinkHealth = async () => {
  const urls = await getActiveUrls();
  
  for (const url of urls) {
    // Simulate health check network call
    const isDead = Math.random() < 0.05; 
    await updateHealthStatus(url.id, isDead ? 'dead' : 'active');
  }
};

export const markDeadLink = async (urlId: number) => {
  await query(`UPDATE urls SET status = 'dead' WHERE url_id = $1`, [urlId]);
};

export const updateHealthStatus = async (urlId: number, status: string) => {
  if (status === 'dead') {
    await markDeadLink(urlId);
  }
};
