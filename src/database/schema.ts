import {
  STARTING_COIN,
  STARTING_MATERIALS,
  STARTING_PRODUCTS,
  STARTING_REPUTATION,
  STARTING_WORKSHOP_LEVEL,
} from '@/config/progression';
import type { MaterialId, ProductId } from '@/types/game';

/** Cari save schema versiyası. Hər dəyişiklikdə migration əlavə edilir. */
export const SAVE_SCHEMA_VERSION = 1;

export const SAVE_KEY = 'save';
export const BACKUP_KEY_PREFIX = 'save_backup_';

export type ProfileData = {
  coin: number;
  reputation: number;
  ordersCompleted: number;
  perfectCount: number;
};

export type ProgressionData = {
  unlockedProducts: ProductId[];
  ownedMaterials: MaterialId[];
  workshopLevel: number;
  tutorialCompleted: boolean;
  /** Sabit sifariş ardıcıllığındakı mövqe */
  fixedOrderIndex: number;
};

export type SettingsData = {
  music: boolean;
  sound: boolean;
  haptics: boolean;
  reduceMotion: boolean;
  locale: string;
};

export type InventoryData = Partial<Record<MaterialId, number>>;

export type SaveData = {
  version: number;
  profile: ProfileData;
  progression: ProgressionData;
  settings: SettingsData;
  inventory: InventoryData;
};

export function createDefaultSave(): SaveData {
  return {
    version: SAVE_SCHEMA_VERSION,
    profile: {
      coin: STARTING_COIN,
      reputation: STARTING_REPUTATION,
      ordersCompleted: 0,
      perfectCount: 0,
    },
    progression: {
      unlockedProducts: [...STARTING_PRODUCTS],
      ownedMaterials: [...STARTING_MATERIALS],
      workshopLevel: STARTING_WORKSHOP_LEVEL,
      tutorialCompleted: false,
      fixedOrderIndex: 0,
    },
    settings: {
      music: true,
      sound: true,
      haptics: true,
      reduceMotion: false,
      locale: 'en',
    },
    // MVP-də inventory gameplay-ə təsir etmir (docs/DECISIONS.md §12).
    inventory: {},
  };
}

/**
 * Save-in strukturunu yoxlayır.
 * Pozulmuş data tətbiqi çökdürməməlidir — docs/DECISIONS.md §15.
 */
export function isValidSave(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const save = value as Partial<SaveData>;

  if (typeof save.version !== 'number') return false;

  const profile = save.profile;
  if (
    typeof profile !== 'object' ||
    profile === null ||
    typeof profile.coin !== 'number' ||
    typeof profile.reputation !== 'number' ||
    !Number.isFinite(profile.coin) ||
    !Number.isFinite(profile.reputation)
  ) {
    return false;
  }

  const progression = save.progression;
  if (
    typeof progression !== 'object' ||
    progression === null ||
    !Array.isArray(progression.unlockedProducts) ||
    !Array.isArray(progression.ownedMaterials) ||
    typeof progression.workshopLevel !== 'number'
  ) {
    return false;
  }

  const settings = save.settings;
  if (
    typeof settings !== 'object' ||
    settings === null ||
    typeof settings.sound !== 'boolean' ||
    typeof settings.haptics !== 'boolean'
  ) {
    return false;
  }

  return true;
}
