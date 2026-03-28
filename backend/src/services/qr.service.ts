import { createQRCode, getQRCodeByUrlId, deleteQRCode as deleteQRModel } from '../models/qr.model';

export const generateQRCode = async (urlId: number, longUrl: string) => {
  // Simulate QR generation & upload to ImageKit
  const simulatedQRUrl = `https://ik.imagekit.io/dummy/qr_${urlId}.png`;
  
  await storeQRCode(urlId, simulatedQRUrl);
  return simulatedQRUrl;
};

export const storeQRCode = async (urlId: number, qrImageUrl: string) => {
  return await createQRCode(urlId, qrImageUrl);
};

export const getQRCode = async (urlId: number) => {
  return await getQRCodeByUrlId(urlId);
};

export const deleteQRCode = async (urlId: number) => {
  return await deleteQRModel(urlId);
};
