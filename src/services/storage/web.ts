import type { StorageAdapter } from './StorageAdapter';
import { SCHEMA_VERSION_KEY } from './StorageAdapter';

const PREFIX = 'packandrelax:';

/**
 * Web preview adapteri — localStorage (docs/DECISIONS.md §15).
 *
 * `expo-sqlite` web-də əlavə konfiqurasiya tələb etdiyi üçün web-ə heç vaxt
 * yüklənmir. Web preview yalnız vizual və məntiq testi üçündür.
 */
export class WebStorageAdapter implements StorageAdapter {
  private memoryFallback: Map<string, string> = new Map();

  private get storage(): Storage | undefined {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : undefined;
    } catch {
      // Private browsing rejimində localStorage-ə giriş throw edə bilər.
      return undefined;
    }
  }

  private read(key: string): string | null {
    const store = this.storage;
    if (store) return store.getItem(PREFIX + key);
    return this.memoryFallback.get(key) ?? null;
  }

  private write(key: string, value: string): void {
    const store = this.storage;
    if (store) {
      store.setItem(PREFIX + key, value);
      return;
    }
    this.memoryFallback.set(key, value);
  }

  private remove(key: string): void {
    const store = this.storage;
    if (store) {
      store.removeItem(PREFIX + key);
      return;
    }
    this.memoryFallback.delete(key);
  }

  async init(): Promise<void> {
    // localStorage hazır gəlir — əlavə hazırlıq tələb olunmur.
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = this.read(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.write(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    this.remove(key);
  }

  async getSchemaVersion(): Promise<number> {
    const version = await this.get<number>(SCHEMA_VERSION_KEY);
    return version ?? 0;
  }

  async setSchemaVersion(version: number): Promise<void> {
    await this.set(SCHEMA_VERSION_KEY, version);
  }

  async transaction(fn: () => Promise<void>): Promise<void> {
    // localStorage-də real transaction yoxdur — snapshot əsaslı rollback.
    // Fallback rejimində də (localStorage əlçatan olmadıqda) işləməlidir.
    const store = this.storage;
    const snapshot = new Map<string, string>();

    if (store) {
      for (let i = 0; i < store.length; i += 1) {
        const fullKey = store.key(i);
        if (fullKey?.startsWith(PREFIX)) {
          snapshot.set(fullKey, store.getItem(fullKey) ?? '');
        }
      }
    } else {
      for (const [key, value] of this.memoryFallback) snapshot.set(key, value);
    }

    try {
      await fn();
    } catch (error) {
      if (store) {
        for (let i = store.length - 1; i >= 0; i -= 1) {
          const fullKey = store.key(i);
          if (fullKey?.startsWith(PREFIX) && !snapshot.has(fullKey)) {
            store.removeItem(fullKey);
          }
        }
        for (const [fullKey, value] of snapshot) store.setItem(fullKey, value);
      } else {
        this.memoryFallback = new Map(snapshot);
      }
      throw error;
    }
  }
}
