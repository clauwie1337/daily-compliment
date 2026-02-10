import { describe, expect, it } from 'vitest';

import {
  CURRENT_SCHEMA_VERSION,
  MemoryStorage,
  migrateStorage,
  STORAGE_KEYS,
  clearHistory,
  getSkin,
  getTheme,
  loadLastShown,
  loadSeenIds,
  loadOrCreateDeviceSeed,
  saveLastShown,
  saveSeenIds,
  setSkin,
  setTheme,
} from '../../src/lib/storage';

describe('storage (NFR-010 / T-101)', () => {
  it('migrates v0 → v1: caps seenIds and drops invalid lastShown', () => {
    const s = new MemoryStorage();

    s.setItem(STORAGE_KEYS.seenIds, JSON.stringify(['a', 1, 'b', null, 'c']));
    s.setItem(STORAGE_KEYS.lastShown, JSON.stringify({ nope: true }));

    migrateStorage(s);

    expect(s.getItem(STORAGE_KEYS.schemaVersion)).toBe(String(CURRENT_SCHEMA_VERSION));
    expect(loadSeenIds(s)).toEqual(['a', 'b', 'c']);
    expect(s.getItem(STORAGE_KEYS.lastShown)).toBeNull();
  });

  it('treats corrupt JSON as missing and uses defaults', () => {
    const s = new MemoryStorage();

    s.setItem(STORAGE_KEYS.seenIds, 'not json');
    s.setItem(STORAGE_KEYS.lastShown, 'not json');

    expect(loadSeenIds(s)).toEqual([]);
    expect(loadLastShown(s)).toBeNull();
  });

  it('theme: system removes key; light/dark persist', () => {
    const s = new MemoryStorage();

    setTheme(s, 'dark');
    expect(getTheme(s)).toBe('dark');

    setTheme(s, 'system');
    expect(getTheme(s)).toBe('system');
    expect(s.getItem(STORAGE_KEYS.theme)).toBeNull();
  });

  it('skin defaults to bathroom for missing/unknown', () => {
    const s = new MemoryStorage();
    expect(getSkin(s)).toBe('bathroom');

    s.setItem(STORAGE_KEYS.skin, 'nonsense');
    expect(getSkin(s)).toBe('bathroom');

    setSkin(s, 'azulejo');
    expect(getSkin(s)).toBe('azulejo');
  });

  it('device seed is created once and cached', () => {
    const s = new MemoryStorage();
    const seed1 = loadOrCreateDeviceSeed(s, { create: () => 'seed-1' });
    const seed2 = loadOrCreateDeviceSeed(s, { create: () => 'seed-2' });

    expect(seed1).toBe('seed-1');
    expect(seed2).toBe('seed-1');
    expect(s.getItem(STORAGE_KEYS.deviceSeed)).toBe('seed-1');
  });

  it('clearHistory removes seenIds and lastShown', () => {
    const s = new MemoryStorage();
    saveSeenIds(s, ['a']);
    saveLastShown(s, { id: 'a', dayKey: '2026-02-10' });

    clearHistory(s);

    expect(s.getItem(STORAGE_KEYS.seenIds)).toBeNull();
    expect(s.getItem(STORAGE_KEYS.lastShown)).toBeNull();
  });
});
