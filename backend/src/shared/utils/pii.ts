import crypto from 'crypto';
import { config } from '../../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey(): Buffer {
  return Buffer.from(config.PII_ENCRYPTION_KEY, 'hex');
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Malformed ciphertext');
  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function mask(value: string): string {
  if (value.length <= 2) return '*'.repeat(value.length);
  return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
}

function decryptName(encFirst: string, encLast: string): { firstName: string; lastName: string } {
  return { firstName: decrypt(encFirst), lastName: decrypt(encLast) };
}

function maskName(encFirst: string, encLast: string): { firstName: string; lastName: string } {
  const { firstName, lastName } = decryptName(encFirst, encLast);
  return { firstName: mask(firstName), lastName: mask(lastName) };
}

export const pii = { encrypt, decrypt, mask, decryptName, maskName };
