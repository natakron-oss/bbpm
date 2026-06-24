import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    // ดึง secret key จาก .env (ต้องยาว 32 bytes)
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret || secret.length < 32) {
      throw new Error('ENCRYPTION_KEY ต้องมีความยาวอย่างน้อย 32 ตัวอักษร');
    }
    this.key = Buffer.from(secret.slice(0, 32), 'utf8');
  }

  // เข้ารหัส (plain text → cipher text)
  encrypt(plainText: string): string {
    if (!plainText) return plainText;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    // เก็บ iv:encryptedData รวมกันเป็น base64
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  // ถอดรหัส (cipher text → plain text)
  decrypt(cipherText: string): string {
    if (!cipherText) return cipherText;
    const [ivHex, encryptedHex] = cipherText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  // เข้ารหัสทุก field ที่ sensitive ใน patient object
  encryptPatient(patient: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'first_name', 'last_name', 'birth_date',
      'phone', 'emergency_contact', 'emergency_phone',
      'address', 'allergies',
    ];
    const result = { ...patient };
    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = this.encrypt(result[field]);
      }
    }
    return result;
  }

  // ถอดรหัสทุก field ที่ sensitive ใน patient object
  decryptPatient(patient: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'first_name', 'last_name', 'birth_date',
      'phone', 'emergency_contact', 'emergency_phone',
      'address', 'allergies',
    ];
    const result = { ...patient };
    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = this.decrypt(result[field]);
      }
    }
    return result;
  }

  // เข้ารหัส treatment record
  encryptTreatment(treatment: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['diagnosis', 'note'];
    const result = { ...treatment };
    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = this.encrypt(result[field]);
      }
    }
    return result;
  }

  // ถอดรหัส treatment record
  decryptTreatment(treatment: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['diagnosis', 'note'];
    const result = { ...treatment };
    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = this.decrypt(result[field]);
      }
    }
    return result;
  }
}
