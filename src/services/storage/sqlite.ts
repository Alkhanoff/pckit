import * as SQLite from 'expo-sqlite';

import type { StorageAdapter } from './StorageAdapter';
import { SCHEMA_VERSION_KEY } from './StorageAdapter';

const DATABASE_NAME = 'packandrelax.db';
const TABLE = 'kv_store';

/**
 * Native adapter — Android / iOS (docs/DECISIONS.md §15).
 *
 * Sadə key-value cədvəli istifadə edir: save data tək JSON sənəd kimi
 * saxlanılır, beləliklə migration məntiqi hər iki platformada eynidir.
 */
export class SqliteStorageAdapter implements StorageAdapter {
  private db?: SQLite.SQLiteDatabase;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await this.db.execAsync(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
    );
  }

  private get connection(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('StorageAdapter istifadədən əvvəl init() edilməlidir');
    }
    return this.db;
  }

  async get<T>(key: string): Promise<T | null> {
    const row = await this.connection.getFirstAsync<{ value: string }>(
      `SELECT value FROM ${TABLE} WHERE key = ?;`,
      key,
    );
    if (!row) return null;
    return JSON.parse(row.value) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.connection.runAsync(
      `INSERT INTO ${TABLE} (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
      key,
      JSON.stringify(value),
    );
  }

  async delete(key: string): Promise<void> {
    await this.connection.runAsync(`DELETE FROM ${TABLE} WHERE key = ?;`, key);
  }

  async getSchemaVersion(): Promise<number> {
    const version = await this.get<number>(SCHEMA_VERSION_KEY);
    return version ?? 0;
  }

  async setSchemaVersion(version: number): Promise<void> {
    await this.set(SCHEMA_VERSION_KEY, version);
  }

  async transaction(fn: () => Promise<void>): Promise<void> {
    await this.connection.withTransactionAsync(fn);
  }
}
