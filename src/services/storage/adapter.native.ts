import { SqliteStorageAdapter } from './sqlite';
import type { StorageAdapter } from './StorageAdapter';

/**
 * Native platform adapteri (Android / iOS).
 *
 * Metro `.native.ts` / `.web.ts` uzantılarına görə düzgün faylı seçir —
 * beləliklə `expo-sqlite` web bundle-ına HEÇ VAXT düşmür.
 * Şərti `require()` bunun üçün kifayət etmir: Metro statik analiz edir və
 * runtime branch-dan asılı olmayaraq modulu bundle-a salır.
 */
export function createPlatformAdapter(): StorageAdapter {
  return new SqliteStorageAdapter();
}
