/**
 * 진료 기록 1차 암호화 (클라이언트, PIN 사용)
 *
 * Web Crypto API로 평문을 PIN으로 암호화한다.
 * 서버는 PIN을 모르므로 1차 복호화 불가.
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const ALGORITHM = 'AES-GCM';

/** PBKDF2용 고정 salt (앱 공통, PIN/patientId와 무관) */
const KDF_SALT_ARRAY = [
  0x6d, 0x69, 0x72, 0x65, 0x2d, 0x72, 0x65, 0x63,
  0x6f, 0x72, 0x64, 0x2d, 0x70, 0x69, 0x6e, 0x2d,
  0x6b, 0x64, 0x66, 0x2d, 0x73, 0x61, 0x6c, 0x74,
];
const KDF_SALT = new Uint8Array(KDF_SALT_ARRAY).buffer;

function getKeyMaterial(pin: string): Uint8Array {
  return new TextEncoder().encode(pin.normalize('NFKC'));
}

async function deriveKey(pin: string): Promise<CryptoKey> {
  const keyMaterial = getKeyMaterial(pin);
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

/**
 * 평문을 PIN으로 암호화한다.
 * @returns IV(12바이트) + ciphertext 를 base64로 인코딩한 문자열
 */
export async function encryptWithPin(
  plaintext: string,
  pin: string,
): Promise<string> {
  if (!pin || pin.trim() === '') {
    throw new Error('PIN이 필요합니다.');
  }
  const key = await deriveKey(pin.trim());
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: 128,
    },
    key,
    encoded,
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * PIN으로 암호화된 문자열을 복호화한다.
 * @param encryptedBase64 IV + ciphertext 의 base64
 */
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
