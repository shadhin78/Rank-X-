/**
 * Secure PIN derivation and credentials formatting for StudyRank authentication.
 *
 * PINs are never stored as plaintext in Firestore. They are converted using
 * a salted Web Cryptography SHA-256 digest into a strong secret, which is then
 * used with Firebase Authentication's scrypt hashing infrastructure.
 */

const AUTH_EMAIL_DOMAIN = 'auth.studyrank.internal';
const PIN_SALT = 'studyrank:v1:secure-pin-salt:';

/**
 * Validates that the username meets format requirements (3-24 alphanumeric, underscore, hyphen)
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const trimmed = username.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Username is required.' };
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }
  if (trimmed.length > 24) {
    return { isValid: false, error: 'Username cannot exceed 24 characters.' };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, dashes, and periods.',
    };
  }
  return { isValid: true };
}

/**
 * Validates that the PIN meets format requirements (4 to 8 digits)
 */
export function validatePin(pin: string): { isValid: boolean; error?: string } {
  if (!pin) {
    return { isValid: false, error: 'PIN is required.' };
  }
  if (!/^\d{4,8}$/.test(pin)) {
    return { isValid: false, error: 'PIN must be between 4 and 8 digits.' };
  }
  return { isValid: true };
}

/**
 * Converts a sanitized username into an internal Firebase Auth email identifier.
 */
export function usernameToAuthEmail(username: string): string {
  const sanitized = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return `${sanitized}@${AUTH_EMAIL_DOMAIN}`;
}

/**
 * Derives a secure, 64-character hex password from username and PIN using Web Crypto SHA-256.
 * The plaintext PIN is never transmitted to Firestore or stored unhashed.
 */
export async function deriveAuthPassword(username: string, pin: string): Promise<string> {
  const normalizedUsername = username.trim().toLowerCase();
  const rawInput = `${PIN_SALT}${normalizedUsername}:${pin.trim()}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(rawInput);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
