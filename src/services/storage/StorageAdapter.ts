/**
 * Platform-müstəqil storage interfeysi — docs/DECISIONS.md §15.
 *
 * UI və gameplay kodu implementasiyanı tanımır, yalnız repository çağırır.
 */
export interface StorageAdapter {
  /** Adapteri hazırlayır (cədvəl yaradır, bağlantı açır və s.) */
  init(): Promise<void>;

  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;

  getSchemaVersion(): Promise<number>;
  setSchemaVersion(version: number): Promise<void>;

  /** Əməliyyatlar qrupunu atomik icra edir. */
  transaction(fn: () => Promise<void>): Promise<void>;
}

export const SCHEMA_VERSION_KEY = '__schema_version__';
