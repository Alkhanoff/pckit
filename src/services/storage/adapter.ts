import type { StorageAdapter } from './StorageAdapter';
import { WebStorageAdapter } from './web';

/**
 * Fallback — Metro platform uzantısı tapmadıqda (məsələn Jest node mühiti).
 * SQLite tələb etmir, ona görə heç bir platformada sınmır.
 */
export function createPlatformAdapter(): StorageAdapter {
  return new WebStorageAdapter();
}
