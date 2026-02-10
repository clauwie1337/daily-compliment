import type { StorageLike } from './storage';

export class MemoryStorage implements StorageLike {
  #m = new Map<string, string>();

  getItem(key: string): string | null {
    return this.#m.has(key) ? (this.#m.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    this.#m.set(key, value);
  }

  removeItem(key: string): void {
    this.#m.delete(key);
  }

  dump(): Record<string, string> {
    return Object.fromEntries(this.#m.entries());
  }
}
