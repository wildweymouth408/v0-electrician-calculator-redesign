/**
 * AES-GCM field-level encryption for sensitive profile data (e.g. license numbers).
 * Key must be a 64-character hex string (256-bit) stored in CREDENTIAL_ENCRYPTION_KEY.
 *
 * Only call these from server-side code (API routes / Server Components).
 * Never expose the key or call these from client components.
 */

const KEY_HEX = process.env.CREDENTIAL_ENCRYPTION_KEY!

async function getKey(): Promise<CryptoKey> {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error(
      'CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string (256-bit). ' +
      'Generate one with: openssl rand -hex 32'
    )
  }
  const match = KEY_HEX.match(/.{1,2}/g)
  if (!match) throw new Error('CREDENTIAL_ENCRYPTION_KEY is malformed.')
  const raw = Uint8Array.from(match.map(byte => parseInt(byte, 16)))
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts a plaintext string using AES-GCM with a random 96-bit IV.
 * Returns a base64-encoded string of [iv (12 bytes) || ciphertext].
 */
export async function encryptField(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypts a base64-encoded AES-GCM ciphertext produced by encryptField().
 * Returns the original plaintext string.
 */
export async function decryptField(encrypted: string): Promise<string> {
  const key = await getKey()
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  return new TextDecoder().decode(plaintext)
}
