import { runMigrations } from '@/database/migrations';
import type { SaveData } from '@/database/schema';
import {
  BACKUP_KEY_PREFIX,
  SAVE_KEY,
  SAVE_SCHEMA_VERSION,
  createDefaultSave,
  isValidSave,
} from '@/database/schema';
import type { StorageAdapter } from '@/services/storage';

/**
 * Save repository — UI və gameplay kodu birbaşa storage ilə işləmir
 * (docs/ARCHITECTURE.md §1 qayda 3).
 *
 * Pozulmuş save HEÇ BİR HALDA tətbiqi çökdürmür:
 * mövcud data backup açarına köçürülür, default profil qaytarılır.
 */

export type LoadResult = {
  save: SaveData;
  /** Save pozulduğu üçün default profil yaradıldı */
  recovered: boolean;
  /** Migration tətbiq edildi */
  migrated: boolean;
};

export class SaveRepository {
  constructor(
    private adapter: StorageAdapter,
    /** Backup açarını təkrarlanabilir etmək üçün (testlərdə sabit dəyər) */
    private now: () => number = Date.now,
  ) {}

  async init(): Promise<void> {
    await this.adapter.init();
  }

  async load(): Promise<LoadResult> {
    let raw: unknown = null;

    try {
      raw = await this.adapter.get<unknown>(SAVE_KEY);
    } catch (error) {
      // JSON parse xətası və ya storage nasazlığı — data oxunmaz sayılır.
      console.warn('[save] oxuma xətası, default profil yaradılır:', error);
      return this.recover(null);
    }

    if (raw === null) {
      const save = runMigrations(null, 0);
      await this.persist(save);
      return { save, recovered: false, migrated: true };
    }

    if (!isValidSave(raw)) {
      console.warn('[save] pozulmuş save aşkarlandı, default profil yaradılır');
      return this.recover(raw);
    }

    if (raw.version < SAVE_SCHEMA_VERSION) {
      try {
        const migrated = runMigrations(raw as unknown as Record<string, unknown>, raw.version);
        await this.persist(migrated);
        return { save: migrated, recovered: false, migrated: true };
      } catch (error) {
        console.warn('[save] migration uğursuz oldu, default profil yaradılır:', error);
        return this.recover(raw);
      }
    }

    if (raw.version > SAVE_SCHEMA_VERSION) {
      // Daha yeni versiyadan gələn save — köhnə kod onu təhlükəsiz oxuya bilməz.
      console.warn('[save] save daha yeni versiyadandır, default profil yaradılır');
      return this.recover(raw);
    }

    return { save: raw, recovered: false, migrated: false };
  }

  private async recover(corrupted: unknown): Promise<LoadResult> {
    if (corrupted !== null) {
      try {
        await this.adapter.set(`${BACKUP_KEY_PREFIX}${this.now()}`, corrupted);
      } catch (error) {
        console.warn('[save] backup yazıla bilmədi:', error);
      }
    }

    const save = createDefaultSave();
    await this.persist(save);
    return { save, recovered: true, migrated: false };
  }

  private async persist(save: SaveData): Promise<void> {
    await this.adapter.set(SAVE_KEY, save);
    await this.adapter.setSchemaVersion(save.version);
  }

  /** Save yazma nöqtələri: sifariş tamamlanması, settings, satınalma, tutorial addımı. */
  async save(data: SaveData): Promise<void> {
    await this.adapter.transaction(async () => {
      await this.persist(data);
    });
  }

  async reset(): Promise<SaveData> {
    const save = createDefaultSave();
    await this.persist(save);
    return save;
  }
}
