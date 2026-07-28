import { createPlatformAdapter } from './adapter';
import type { StorageAdapter } from './StorageAdapter';

export type { StorageAdapter } from './StorageAdapter';
export { SCHEMA_VERSION_KEY } from './StorageAdapter';
export { MemoryStorageAdapter } from './memory';
export { WebStorageAdapter } from './web';

let instance: StorageAdapter | undefined;

/**
 * Platforma uyğun adapteri qaytarır — seçim burada bir dəfə edilir
 * (docs/DECISIONS.md §15).
 *
 * Platform seçimi `adapter.native.ts` / `adapter.web.ts` fayl uzantıları ilə
 * edilir, şərti `require()` ilə YOX. Səbəb: Metro statik analiz edir və
 * `if (Platform.OS === 'web')` budağından asılı olmayaraq `expo-sqlite`-ı
 * web bundle-ına salır — bu isə `wa-sqlite.wasm` resolve xətası verir.
 */
export function getStorageAdapter(): StorageAdapter {
  if (!instance) {
    instance = createPlatformAdapter();
  }
  return instance;
}

/** Testlər üçün adapteri əvəz edir. */
export function setStorageAdapter(adapter: StorageAdapter): void {
  instance = adapter;
}
