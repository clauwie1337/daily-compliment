export const STORAGE_KEYS = {
  schemaVersion: 'dc:schemaVersion',
  theme: 'dc:theme',
  skin: 'dc:skin',
  deviceSeed: 'dc:deviceSeed',
  seenIds: 'dc:seenIds',
  lastShown: 'dc:lastShown',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
