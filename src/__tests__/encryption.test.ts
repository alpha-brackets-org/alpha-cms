import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '@/lib/encryption';

describe('encrypt / decrypt', () => {
  it('round-trips a plain text string', () => {
    const original = 'smtp-password-123!';
    const ciphertext = encrypt(original);
    expect(ciphertext).not.toBe(original);
    expect(ciphertext).toContain(':');
    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const a = encrypt('same-text');
    const b = encrypt('same-text');
    expect(a).not.toBe(b);
  });

  it('returns empty string for invalid ciphertext', () => {
    const result = decrypt('not-valid-ciphertext');
    expect(result).toBe('');
  });
});
