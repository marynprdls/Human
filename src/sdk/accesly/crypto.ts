import CryptoJS from 'crypto-js';
import { Keypair } from '@stellar/stellar-sdk';

export class CryptoUtils {
  static generateKeypair(provider: string, identifier: string, salt: string = 'stellar-social-v1'): Keypair {
    const combined = `${provider}:${identifier}:${salt}`;
    const hash = CryptoJS.SHA256(combined);

    const seedBytes = new Uint8Array(32);
    const hashWords = hash.words;

    for (let i = 0; i < 8; i++) {
      const word = hashWords[i];
      seedBytes[i * 4] = (word >>> 24) & 0xff;
      seedBytes[i * 4 + 1] = (word >>> 16) & 0xff;
      seedBytes[i * 4 + 2] = (word >>> 8) & 0xff;
      seedBytes[i * 4 + 3] = word & 0xff;
    }

    return Keypair.fromRawEd25519Seed(Buffer.from(seedBytes));
  }

  static generateSeed(provider: string, identifier: string, salt: string = 'stellar-social-v1'): string {
    const combined = `${provider}:${identifier}:${salt}`;
    return CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex);
  }

  static isValidJWT(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }

  static hashPhone(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return CryptoJS.SHA256(cleaned).toString(CryptoJS.enc.Hex).substring(0, 32);
  }

  static randomKeypair(): Keypair {
    return Keypair.random();
  }
}
