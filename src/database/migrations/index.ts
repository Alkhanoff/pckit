import type { SaveData } from '../schema';
import { SAVE_SCHEMA_VERSION, createDefaultSave } from '../schema';

/**
 * Migration sistemi — irəli-yalnız, ardıcıl, idempotent.
 *
 * Hər migration `from` versiyasından `from + 1`-ə keçirir.
 * Migration-lar HEÇ VAXT geriyə dönmür və mövcud data-nı silmir.
 */

export type Migration = {
  /** Bu versiyadan növbətiyə keçir */
  from: number;
  description: string;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
};

export const MIGRATIONS: Migration[] = [
  {
    from: 0,
    description: 'Boş save-dən v1 default profilinin yaradılması',
    migrate: () => createDefaultSave() as unknown as Record<string, unknown>,
  },
  // Növbəti migration nümunəsi:
  // {
  //   from: 1,
  //   description: 'v2: statistika sahələri əlavə edildi',
  //   migrate: (data) => ({ ...data, version: 2, stats: { totalDefectsRepaired: 0 } }),
  // },
];

/** Verilmiş versiyadan cari versiyaya qədər bütün migration-ları tətbiq edir. */
export function runMigrations(
  data: Record<string, unknown> | null,
  fromVersion: number,
  targetVersion: number = SAVE_SCHEMA_VERSION,
): SaveData {
  let current = data ?? {};
  let version = fromVersion;

  while (version < targetVersion) {
    const migration = MIGRATIONS.find((m) => m.from === version);
    if (!migration) {
      throw new Error(`Migration tapılmadı: v${version} → v${version + 1}`);
    }
    current = migration.migrate(current);
    version += 1;
    current.version = version;
  }

  return current as unknown as SaveData;
}

/** Migration zəncirinin tam olub-olmadığını yoxlayır (test invarianti). */
export function hasCompleteMigrationChain(targetVersion = SAVE_SCHEMA_VERSION): boolean {
  for (let v = 0; v < targetVersion; v += 1) {
    if (!MIGRATIONS.some((m) => m.from === v)) return false;
  }
  return true;
}
