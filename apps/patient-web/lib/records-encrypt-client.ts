/**
 * 진료 기록 1차 복호화 (클라이언트, PIN 사용).
 * hospital-web의 records-encrypt-client와 동일 — PIN으로 cipher1 복호화.
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const ALGORITHM = 'AES-GCM';

const KDF_SALT_ARRAY = [
  0x6d, 0x69, 0x72, 0x65, 0x2d, 0x72, 0x65, 0x63,
  0x6f, 0x72, 0x64, 0x2d, 0x70, 0x69, 0x6e, 0x2d,
  0x6b, 0x64, 0x66, 0x2d, 0x73, 0x61, 0x6c, 0x74,
];
const KDF_SALT = new Uint8Array(KDF_SALT_ARRAY).buffer;

async function deriveKey(pin: string): Promise<CryptoKey> {
  const keyMaterial = new TextEncoder().encode(pin.normalize('NFKC'));
  const imported = await crypto.subtle.importKey(
    'raw',
    keyMaterial as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: KDF_SALT as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    imported,
    KEY_LENGTH,
  );
  return crypto.subtle.importKey(
    'raw',
    bits,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function decryptWithPin(
  encryptedBase64: string,
  pin: string,
): Promise<string> {
  if (!pin || pin.trim() === '') {
    throw new Error('PIN이 필요합니다.');
  }
  const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0),
  );
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  const key = await deriveKey(pin.trim());
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: 128,
    },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}
