import type { StorageAdapter } from './StorageAdapter';
import { WebStorageAdapter } from './web';

/** Web preview adapteri — localStorage (docs/DECISIONS.md §15). */
export function createPlatformAdapter(): StorageAdapter {
  return new WebStorageAdapter();
}
