const STORAGE_KEY_CLIENT_ID = 'mahjong_client_id';
const STORAGE_KEY_NICKNAME = 'mahjong_nickname';

/**
 * Returns the current client ID if it exists in localStorage, without auto-generating one.
 * Adheres to the lazy UUID generation principle.
 */
export function getClientId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  } catch {
    return null;
  }
}

/**
 * Ensures a persistent client UUID exists in localStorage.
 * Lazily creates a new UUID v4 if none exists.
 */
export function ensureClientId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (existing) {
      return existing;
    }
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'client_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, newId);
    return newId;
  } catch {
    return 'fallback_' + Date.now();
  }
}

/**
 * Retrieves the stored nickname from localStorage.
 */
export function getStoredNickname(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_NICKNAME) || '';
  } catch {
    return '';
  }
}

/**
 * Stores the user's nickname in localStorage.
 */
export function setStoredNickname(nickname: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_NICKNAME, nickname.trim());
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Clears all client registration data from localStorage.
 * Used during device reset.
 */
export function clearClientStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    localStorage.removeItem(STORAGE_KEY_NICKNAME);
  } catch {
    // ignore
  }
}
