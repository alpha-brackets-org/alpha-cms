import crypto from 'crypto';

function requireEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY or AUTH_SECRET must be set — refusing to encrypt sensitive data with a hardcoded key.'
    );
  }
  return key;
}

const ENCRYPTION_KEY = requireEncryptionKey();

const IV_LENGTH = 16; // For AES, this is always 16

/**
 * ALPHA CMS ENCRYPTION UTILITY
 * Uses AES-256-CBC for encrypting sensitive data like SMTP passwords.
 */
export function encrypt(text: string): string {
  // Ensure key is 32 bytes
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Generates a new plaintext API key for a portfolio. Only ever shown to the
 * user once, at generation time — never persisted or retrievable again.
 */
export function generateApiKey(): string {
  return `pk_live_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * One-way hash of an API key for storage/comparison. Unlike encrypt()/decrypt(),
 * this is never reversed — we only ever need to verify an incoming key against
 * the stored hash, never re-display the plaintext.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');

    // Ensure key is 32 bytes
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('DECRYPTION_FAILED:', err);
    }
    return ''; // Return empty string if decryption fails
  }
}
