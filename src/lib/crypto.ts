import bcrypt from 'bcryptjs';

// Choose a suitable number of salt rounds. Higher is more secure but slower.
// 10-12 is generally recommended for web/mobile apps.
const SALT_ROUNDS = 10; 

/**
 * Legacy simple hash function used before bcrypt implementation.
 * This matches the previous hash function that was used in the app.
 * @param value String to hash
 * @returns Simple hash string
 */
function legacyHash(value: string): string {
  if (!value) return '';
  
  // This is the original hash function that was used in the app
  // It's a simple hash that just sums char codes and multiplies by a prime
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Detects if a hash is in bcrypt format by checking for the characteristic prefix
 * @param hash The hash to check
 * @returns boolean indicating if this is a bcrypt hash
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}

/**
 * Hashes a given string (e.g., PIN or security answer) using bcrypt.
 * This is an asynchronous operation.
 * @param value The string to hash.
 * @returns Promise<string> The hashed string.
 */
export async function hashValue(value: string): Promise<string> {
  if (!value) return ''; 
  return await bcrypt.hash(value, SALT_ROUNDS);
}

/**
 * Compares a plain text value against a hash, supporting both bcrypt and legacy hashing.
 * This is an asynchronous operation.
 * @param value The plain text value to compare.
 * @param hash The hash to compare against (either bcrypt or legacy).
 * @returns Promise<boolean> True if the value matches the hash, false otherwise.
 */
export async function compareHash(value: string, hash: string): Promise<boolean> {
  if (!value || !hash) return false;
  
  // Check if this is a bcrypt hash
  if (isBcryptHash(hash)) {
    return await bcrypt.compare(value, hash);
  } else {
    // This is a legacy hash, use the old method
    const legacyHashedValue = legacyHash(value);
    return legacyHashedValue === hash;
  }
}
