import {
  getClientId,
  ensureClientId,
  getStoredNickname,
  setStoredNickname,
  clearClientStorage,
} from './clientId';

describe('clientId utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('getClientId returns null initially (lazy principle)', () => {
    expect(getClientId()).toBeNull();
  });

  test('ensureClientId generates and persists a UUID', () => {
    const id1 = ensureClientId();
    expect(id1).toBeTruthy();
    expect(getClientId()).toBe(id1);

    // Subsequent call returns the same ID
    const id2 = ensureClientId();
    expect(id2).toBe(id1);
  });

  test('nickname get and set works', () => {
    expect(getStoredNickname()).toBe('');
    setStoredNickname('마작왕');
    expect(getStoredNickname()).toBe('마작왕');
  });

  test('clearClientStorage removes both client_id and nickname', () => {
    ensureClientId();
    setStoredNickname('마작왕');
    expect(getClientId()).toBeTruthy();
    expect(getStoredNickname()).toBe('마작왕');

    clearClientStorage();
    expect(getClientId()).toBeNull();
    expect(getStoredNickname()).toBe('');
  });
});
