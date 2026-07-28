import { Platform } from 'react-native';

import { MemoryStorageAdapter } from './memory';
import type { StorageAdapter } from './StorageAdapter';
import { WebStorageAdapter } from './web';

export type { StorageAdapter } from './StorageAdapter';
export { SCHEMA_VERSION_KEY } from './StorageAdapter';
export { MemoryStorageAdapter } from './memory';
export { WebStorageAdapter } from './web';

let instance: StorageAdapter | undefined;

/**
 * Platforma uyğun adapteri qaytarır — seçim burada bir dəfə edilir
 * (docs/DECISIONS.md §15).
 *
 * `expo-sqlite` yalnız native platformada `require` edilir ki, web bundle-a
 * düşməsin və Jest-də təsadüfən yüklənməsin.
 */
export function getStorageAdapter(): StorageAdapter {
  if (instance) return instance;

  if (Platform.OS === 'web') {
    instance = new WebStorageAdapter();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SqliteStorageAdapter } = require('./sqlite') as typeof import('./sqlite');
    instance = new SqliteStorageAdapter();
  }

  return instance;
}

/** Testlər üçün adapteri əvəz edir. */
export function setStorageAdapter(adapter: StorageAdapter): void {
  instance = adapter;
}

export function resetStorageAdapter(): void {
  instance = undefined;
}

/** Test mühitində rahat qurulum. */
export function useMemoryStorage(): MemoryStorageAdapter {
  const adapter = new MemoryStorageAdapter();
  setStorageAdapter(adapter);
  return adapter;
}
