import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  generateRandomPassword,
} from '@/lib/auth-utils';

describe('hashPassword / comparePassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('my-secret-password');
    expect(hash).toContain(':');
    const valid = await comparePassword('my-secret-password', hash);
    expect(valid).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct-password');
    const valid = await comparePassword('wrong-password', hash);
    expect(valid).toBe(false);
  });

  it('produces different hashes for the same password (unique salts)', async () => {
    const hash1 = await hashPassword('same-password');
    const hash2 = await hashPassword('same-password');
    expect(hash1).not.toBe(hash2);
  });
});

describe('signToken / verifyToken', () => {
  const payload = { userId: '507f1f77bcf86cd799439011', email: 'admin@test.com', role: 'admin' };

  it('signs and verifies a token successfully', async () => {
    const token = await signToken(payload);
    const decoded = await verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
  });

  it('returns null for a tampered token', async () => {
    const token = await signToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    const decoded = await verifyToken(tampered);
    expect(decoded).toBeNull();
  });

  it('returns null for an empty string', async () => {
    const decoded = await verifyToken('');
    expect(decoded).toBeNull();
  });
});

describe('generateRandomPassword', () => {
  it('generates a password of the requested length', () => {
    const pwd = generateRandomPassword(16);
    expect(pwd.length).toBe(16);
  });

  it('generates different passwords each time', () => {
    const a = generateRandomPassword();
    const b = generateRandomPassword();
    expect(a).not.toBe(b);
  });
});
