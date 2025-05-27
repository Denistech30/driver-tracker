/**
 * Simple hashing function for PINs and security answers
 * This uses a basic hash for demo purposes. In a production app,
 * use a proper crypto library with salt and more secure algorithms.
 */
export function hashValue(value: string): string {
  // Simple hash function - for educational purposes only
  // In production, use a proper crypto library
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
