/**
 * 진료 기록 2·3차 복호화 (patient-web 서버 전용).
 * hospital-web의 records-encrypt-server와 동일한 방식으로 cipher1을 복원한다.
 */

import { createDecipheriv, pbkdf2Sync } from 'node:crypto';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const ALGORITHM = 'aes-256-gcm';
const TAG_LENGTH = 16;

const KDF_SALT = Buffer.from('mire-record-layer2-layer3-kdf-salt-v1', 'utf8');

function deriveKey(password: string): Buffer {
  return pbkdf2Sync(
    password,
    KDF_SALT,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256',
  );
}

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

/** 3차 복호화 (serverSalt) */
export function decryptLayer3(
  encryptedBase64: string,
  serverSalt: string,
): string {
  return decrypt(encryptedBase64, serverSalt);
}

/** 2차 복호화 (patientId) */
export function decryptLayer2(
  encryptedBase64: string,
  patientId: string,
): string {
  return decrypt(encryptedBase64, patientId.trim());
}
