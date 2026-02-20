import sharp from 'sharp';
import { resolve } from 'path';

const input = resolve('public/icon-512x512.jpg');

// First, get the image dimensions
const metadata = await sharp(input).metadata();
console.log(`Original size: ${metadata.width}x${metadata.height}`);

// Trim the black border by detecting non-black pixels
// Use trim() to auto-crop the dark surrounding area
const trimmed = await sharp(input)
  .trim({ background: '#000000', threshold: 30 })
  .toBuffer();

const trimmedMeta = await sharp(trimmed).metadata();
console.log(`Trimmed size: ${trimmedMeta.width}x${trimmedMeta.height}`);

// Make it square by using the larger dimension
const size = Math.max(trimmedMeta.width, trimmedMeta.height);

// Save the cropped 512x512 version
await sharp(trimmed)
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(resolve('public/icon-512x512.png'));

// Generate 192x192 for manifest
await sharp(trimmed)
  .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(resolve('public/icon-192x192.png'));

// Generate 180x180 for Apple touch icon
await sharp(trimmed)
  .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(resolve('public/apple-icon.png'));

// Generate 32x32 for favicon
await sharp(trimmed)
  .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(resolve('public/favicon.png'));

console.log('All icon sizes generated successfully');
