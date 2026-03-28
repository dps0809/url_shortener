import QRCode from 'qrcode';
import ImageKit from 'imagekit';

let imagekitClient: ImageKit | null = null;

function getImageKit(): ImageKit | null {
  if (
    !process.env.IMAGEKIT_PUBLIC_KEY ||
    !process.env.IMAGEKIT_PRIVATE_KEY ||
    !process.env.IMAGEKIT_URL_ENDPOINT
  ) {
    return null;
  }
  if (!imagekitClient) {
    imagekitClient = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekitClient;
}

/**
 * Generate a QR code for the given URL.
 * Uploads to ImageKit CDN if configured, otherwise returns a data URI.
 */
export async function generateQrCode(
  shortUrl: string,
  shortCode: string
): Promise<string> {
  // Generate QR code as PNG buffer
  const buffer = await QRCode.toBuffer(shortUrl, {
    type: 'png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Try uploading to ImageKit
  const ik = getImageKit();
  if (ik) {
    try {
      const uploadResponse = await ik.upload({
        file: buffer,
        fileName: `qr_${shortCode}.png`,
        folder: '/url-shortener/qrcodes/',
      });
      return uploadResponse.url;
    } catch (error) {
      console.error('ImageKit upload failed, falling back to data URI:', error);
    }
  }

  // Fallback: return data URI
  const dataUri = await QRCode.toDataURL(shortUrl, {
    width: 400,
    margin: 2,
  });
  return dataUri;
}
