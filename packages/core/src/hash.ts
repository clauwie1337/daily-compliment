/**
 * Small, dependency-free 32-bit FNV-1a hash for deterministic indexing.
 *
 * NOTE: Not cryptographically secure.
 */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // hash *= 16777619 (but keep in 32-bit)
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash >>> 0;
}

export function hashToIndex(hash: number, size: number): number {
  if (!Number.isInteger(size) || size <= 0) throw new Error(`size must be > 0 (got ${size})`);
  return hash % size;
}
