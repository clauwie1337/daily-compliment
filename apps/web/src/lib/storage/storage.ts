import { STORAGE_KEYS } from './keys';

export type ThemeMode = 'system' | 'light' | 'dark';
export type SkinMode = 'bathroom' | 'azulejo' | 'default';

export type LastShown = {
  id: string;
  dayKey?: string;
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const CURRENT_SCHEMA_VERSION = 1 as const;

function safeJsonParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function safeNumber(raw: string | null): number | null {
  if (raw == null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function capStringArray(v: unknown, cap: number): string[] {
  if (!Array.isArray(v)) return [];
  const strings = v.filter((x) => typeof x === 'string');
  return strings.slice(-cap);
}

function parseLastShown(v: unknown): LastShown | null {
  if (!v || typeof v !== 'object') return null;
  const obj = v as Record<string, unknown>;
  const id = obj.id;
  const dayKey = obj.dayKey;
  if (typeof id !== 'string') return null;
  if (dayKey != null && typeof dayKey !== 'string') return null;
  return dayKey ? { id, dayKey } : { id };
}

/**
 * Migrate in-place. Must never throw.
 *
 * v0 → v1:
 * - introduce schema version key
 * - normalize/cap seenIds
 * - drop invalid lastShown
 */
export function migrateStorage(storage: StorageLike): void {
  try {
    const raw = storage.getItem(STORAGE_KEYS.schemaVersion);
    const existing = safeNumber(raw) ?? 0;
    if (existing >= CURRENT_SCHEMA_VERSION) return;

    // v0 → v1
    if (existing < 1) {
      const seenRaw = storage.getItem(STORAGE_KEYS.seenIds);
      const seenParsed = safeJsonParse(seenRaw);
      const normalized = capStringArray(seenParsed, 500);
      storage.setItem(STORAGE_KEYS.seenIds, JSON.stringify(normalized));

      const lastRaw = storage.getItem(STORAGE_KEYS.lastShown);
      const lastParsed = safeJsonParse(lastRaw);
      const last = parseLastShown(lastParsed);
      if (last) storage.setItem(STORAGE_KEYS.lastShown, JSON.stringify(last));
      else storage.removeItem(STORAGE_KEYS.lastShown);

      storage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION));
    }
  } catch {
    // ignore
  }
}

export function getTheme(storage: StorageLike): ThemeMode {
  try {
    const v = storage.getItem(STORAGE_KEYS.theme);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function setTheme(storage: StorageLike, mode: ThemeMode): void {
  try {
    if (mode === 'system') storage.removeItem(STORAGE_KEYS.theme);
    else storage.setItem(STORAGE_KEYS.theme, mode);
  } catch {
    // ignore
  }
}

export function getSkin(storage: StorageLike): SkinMode {
  try {
    const v = storage.getItem(STORAGE_KEYS.skin);
    return v === 'default' || v === 'azulejo' || v === 'bathroom' ? v : 'bathroom';
  } catch {
    return 'bathroom';
  }
}

export function setSkin(storage: StorageLike, mode: SkinMode): void {
  try {
    storage.setItem(STORAGE_KEYS.skin, mode);
  } catch {
    // ignore
  }
}

export function loadSeenIds(storage: StorageLike): string[] {
  try {
    const parsed = safeJsonParse(storage.getItem(STORAGE_KEYS.seenIds));
    return capStringArray(parsed, 500);
  } catch {
    return [];
  }
}

export function saveSeenIds(storage: StorageLike, ids: string[]): void {
  try {
    storage.setItem(STORAGE_KEYS.seenIds, JSON.stringify(ids.slice(-500)));
  } catch {
    // ignore
  }
}

export function loadLastShown(storage: StorageLike): LastShown | null {
  try {
    const parsed = safeJsonParse(storage.getItem(STORAGE_KEYS.lastShown));
    return parseLastShown(parsed);
  } catch {
    return null;
  }
}

export function saveLastShown(storage: StorageLike, last: LastShown): void {
  try {
    storage.setItem(STORAGE_KEYS.lastShown, JSON.stringify(last));
  } catch {
    // ignore
  }
}

export function loadOrCreateDeviceSeed(storage: StorageLike, opts?: { override?: string; create?: () => string }): string {
  const override = opts?.override;
  if (override) return override;

  try {
    const existing = storage.getItem(STORAGE_KEYS.deviceSeed);
    if (existing) return existing;

    const seed = opts?.create?.() ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()));
    storage.setItem(STORAGE_KEYS.deviceSeed, seed);
    return seed;
  } catch {
    return override ?? opts?.create?.() ?? String(Math.random());
  }
}

export function clearHistory(storage: StorageLike): void {
  try {
    storage.removeItem(STORAGE_KEYS.seenIds);
    storage.removeItem(STORAGE_KEYS.lastShown);
  } catch {
    // ignore
  }
}
