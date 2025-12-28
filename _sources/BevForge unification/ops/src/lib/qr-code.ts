/**
 * Simple QR Code generator using data URL
 * For production, consider using a library like qrcode or qr-code-styling
 */

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Generate a QR code data URL for the given text
 * This is a simplified implementation - for production use a proper QR library
 */
export function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): string {
  const {
    size = 200,
    margin = 4,
    color = '#000000',
    backgroundColor = '#FFFFFF',
  } = options;

  // For now, return a placeholder SVG QR code
  // In production, integrate with a proper QR code library
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="monospace" font-size="12" fill="${color}">
        QR: ${text.substring(0, 20)}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generate QR code for a container
 */
export function generateContainerQR(containerId: string): string {
  const data = JSON.stringify({
    type: 'container',
    id: containerId,
    timestamp: Date.now(),
  });
  return generateQRCode(data);
}

/**
 * Generate QR code for a pallet
 */
export function generatePalletQR(palletId: string): string {
  const data = JSON.stringify({
    type: 'pallet',
    id: palletId,
    timestamp: Date.now(),
  });
  return generateQRCode(data);
}

/**
 * Parse QR code data
 */
export function parseQRCode(data: string): {
  type: 'container' | 'pallet';
  id: string;
  timestamp: number;
} | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Download QR code as image
 */
export function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
