import type { StorageAdapter } from './StorageAdapter';
import { SCHEMA_VERSION_KEY } from './StorageAdapter';

/**
 * Yaddaşda saxlanan adapter — Jest testləri üçün (docs/DECISIONS.md §15).
 * Real adapterlərlə eyni test dəstini keçməlidir.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();
  private initialized = false;

  async init(): Promise<void> {
    this.initialized = true;
  }

  private assertReady(): void {
    if (!this.initialized) {
      throw new Error('StorageAdapter istifadədən əvvəl init() edilməlidir');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.assertReady();
    const raw = this.store.get(key);
    if (raw === undefined) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.assertReady();
    this.store.set(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    this.assertReady();
    this.store.delete(key);
  }

  async getSchemaVersion(): Promise<number> {
    const version = await this.get<number>(SCHEMA_VERSION_KEY);
    return version ?? 0;
  }

  async setSchemaVersion(version: number): Promise<void> {
    await this.set(SCHEMA_VERSION_KEY, version);
  }

  async transaction(fn: () => Promise<void>): Promise<void> {
    const snapshot = new Map(this.store);
    try {
      await fn();
    } catch (error) {
      this.store = snapshot;
      throw error;
    }
  }

  /** Yalnız testlər üçün — pozulmuş save simulyasiyası. */
  seedRaw(key: string, rawValue: string): void {
    this.store.set(key, rawValue);
  }

  /** Yalnız testlər üçün. */
  keys(): string[] {
    return [...this.store.keys()];
  }
}
