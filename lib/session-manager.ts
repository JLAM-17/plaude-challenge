import { randomBytes } from 'crypto';

/**
 * Session Manager for tracking user conversations
 * Each session represents a unique user conversation
 */

/**
 * Generate a unique session ID
 * Format: sess_<timestamp>_<random>
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const randomPart = randomBytes(8).toString('hex');
  return `sess_${timestamp}_${randomPart}`;
}

/**
 * Validate a session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  return /^sess_\d+_[a-f0-9]{16}$/.test(sessionId);
}
