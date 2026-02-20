import { readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('CWD:', process.cwd());
console.log('Home:', process.env.HOME);

// Check various possible locations
const paths = [
  'public/icon-512x512.jpg',
  resolve('public/icon-512x512.jpg'),
  '/home/user/public/icon-512x512.jpg',
  '/vercel/share/v0-project/public/icon-512x512.jpg',
];

for (const p of paths) {
  console.log(`${p} exists: ${existsSync(p)}`);
}

// List public dir contents
try {
  const pubDir = resolve('public');
  console.log(`\nContents of ${pubDir}:`);
  console.log(readdirSync(pubDir));
} catch (e) {
  console.log('Could not list public dir:', e.message);
}
