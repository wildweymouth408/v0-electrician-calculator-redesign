const KEY_HEX = process.env.CREDENTIAL_ENCRYPTION_KEY!

async function getKey(): Promise<CryptoKey> {
  const raw = Uint8Array.from(
    KEY_HEX.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  )
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptField(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  const combined = new Uint8Array([...iv, ...new Uint8Array(ciphertext)])
  return btoa(String.fromCharCode(...combined))
}

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
