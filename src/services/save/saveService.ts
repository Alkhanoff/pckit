import type { SaveData } from '@/database/schema';
import { SAVE_SCHEMA_VERSION } from '@/database/schema';
import { SaveRepository } from '@/repositories/saveRepository';
import { getStorageAdapter } from '@/services/storage';
import type { StorageAdapter } from '@/services/storage';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useProgressionStore } from '@/stores/useProgressionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

/**
 * Save ilə store-lar arasındakı körpü.
 *
 * Yazma nöqtələri (docs/DECISIONS.md §15): sifariş tamamlandıqda,
 * settings dəyişdikdə, satınalma edildikdə, tutorial addımı bitdikdə.
 * Gameplay ortasında save YOXDUR.
 */

let repository: SaveRepository | undefined;
let ready = false;

export function getSaveRepository(adapter?: StorageAdapter): SaveRepository {
  if (!repository) {
    repository = new SaveRepository(adapter ?? getStorageAdapter());
  }
  return repository;
}

/** Testlər üçün — repository və hazırlıq bayrağını sıfırlayır. */
export function resetSaveService(): void {
  repository = undefined;
  ready = false;
}

export function isSaveReady(): boolean {
  return ready;
}

function hydrateStores(save: SaveData): void {
  useProfileStore.getState().hydrate(save.profile);
  useProgressionStore.getState().hydrate(save.progression);
  useSettingsStore.getState().hydrate(save.settings);
  useInventoryStore.getState().hydrate(save.inventory);
}

export function collectSave(): SaveData {
  return {
    version: SAVE_SCHEMA_VERSION,
    profile: useProfileStore.getState().toData(),
    progression: useProgressionStore.getState().toData(),
    settings: useSettingsStore.getState().toData(),
    inventory: useInventoryStore.getState().toData(),
  };
}

/** Tətbiq açılışında bir dəfə çağırılır. */
export async function loadSave(adapter?: StorageAdapter): Promise<SaveData> {
  const repo = getSaveRepository(adapter);
  await repo.init();

  const { save, recovered } = await repo.load();
  hydrateStores(save);
  ready = true;

  if (recovered) {
    console.warn('[save] əvvəlki save bərpa edilə bilmədi — yeni profil ilə başlanır');
  }

  return save;
}

/**
 * Cari store vəziyyətini diskə yazır.
 *
 * Save hazır olmadan çağırılarsa səssizcə keçir — əks halda açılış zamanı
 * yarımçıq state diskə yazılıb mövcud progress-i silə bilər.
 */
export async function persistSave(): Promise<void> {
  if (!ready || !repository) return;

  try {
    await repository.save(collectSave());
  } catch (error) {
    // Save xətası gameplay-i dayandırmır — oyunçu oynamağa davam edir.
    console.warn('[save] yazıla bilmədi:', error);
  }
}
