import { createUrl, getUrlsByUser, updateExpiryDate, disableUrl as disableUrlModel, enableUrl as enableUrlModel, softDeleteUrl, checkShortCodeExists } from '../models/url.model';
import { enqueueLinkCreation } from './queue.service';
import { checkCreationLimit } from './rateLimit.service';

export const createShortUrl = async (longUrl: string, userId: number, customAlias?: string, expiryDate?: Date) => {
  const isAllowed = await checkCreationLimit(userId);
  if (!isAllowed) throw new Error('Rate limit exceeded');

  let shortCode = customAlias;
  if (customAlias) {
    const exists = await checkAliasAvailability(customAlias);
    if (!exists) throw new Error('Alias already in use');
  } else {
    shortCode = Math.random().toString(36).substring(2, 8);
  }

  const urlRecord = await createUrl(shortCode!, longUrl, userId, expiryDate || null);
  if (urlRecord) {
    await enqueueLinkCreation(urlRecord.id, urlRecord.short_code, urlRecord.long_url);
  }
  return urlRecord;
};

export const getUserUrls = async (userId: number, limit: number = 10, offset: number = 0) => {
  return await getUrlsByUser(userId, limit, offset);
};

export const updateExpiry = async (id: number, expiryDate: Date) => {
  return await updateExpiryDate(id, expiryDate);
};

export const disableUrl = async (id: number) => {
  return await disableUrlModel(id);
};

export const enableUrl = async (id: number) => {
  return await enableUrlModel(id);
};

export const deleteUrl = async (id: number) => {
  return await softDeleteUrl(id);
};

export const checkAliasAvailability = async (code: string) => {
  const exists = await checkShortCodeExists(code);
  return !exists;
};
