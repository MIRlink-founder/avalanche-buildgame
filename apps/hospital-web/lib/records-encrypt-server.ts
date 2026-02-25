/**
 * 진료 기록 2·3차 암호화 (서버 전용)
 *
 * 2차: patientId로 암호화, 3차: serverSalt로 암호화.
 * Node crypto AES-256-GCM + PBKDF2.
 */

import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const ALGORITHM = 'aes-256-gcm';
const TAG_LENGTH = 16;

/** PBKDF2용 고정 salt (2·3차 레이어 공통) */
const KDF_SALT = Buffer.from(
  'mire-record-layer2-layer3-kdf-salt-v1',
  'utf8',
);

function deriveKey(password: string): Buffer {
  return pbkdf2Sync(
    password,
    KDF_SALT,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256',
  );
}

/**
 * 입력(문자열)을 비밀키로 암호화한다.
 * @returns IV(12) + ciphertext + tag(16) 를 base64로 인코딩
 */
function encrypt(input: string, password: string): string {
  const key = deriveKey(password);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([
    cipher.update(input, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, encrypted, tag]);
  return combined.toString('base64');
}

/**
 * base64 암호문을 비밀키로 복호화한다.
 */
function decrypt(encryptedBase64: string, password: string): string {
  const combined = Buffer.from(encryptedBase64, 'base64');
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(combined.length - TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);
  const key = deriveKey(password);
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

/**
 * 2차 암호화: cipher1(클라이언트에서 PIN으로 암호화된 결과)을 patientId로 암호화
 */
export function encryptLayer2(cipher1Base64: string, patientId: string): string {
  return encrypt(cipher1Base64, patientId.trim());
}

/**
 * 3차 암호화: cipher2를 serverSalt로 암호화
 */
export function encryptLayer3(cipher2Base64: string, serverSalt: string): string {
  return encrypt(cipher2Base64, serverSalt);
}

/**
 * 3차 복호화 (serverSalt)
 */
export function decryptLayer3(encryptedBase64: string, serverSalt: string): string {
  return decrypt(encryptedBase64, serverSalt);
}

/**
 * 2차 복호화 (patientId)
 */
export function decryptLayer2(encryptedBase64: string, patientId: string): string {
  return decrypt(encryptedBase64, patientId.trim());
}
