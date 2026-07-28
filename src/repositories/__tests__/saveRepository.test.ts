import { MIGRATIONS, hasCompleteMigrationChain, runMigrations } from '@/database/migrations';
import { SAVE_KEY, SAVE_SCHEMA_VERSION, createDefaultSave, isValidSave } from '@/database/schema';
import { MemoryStorageAdapter, WebStorageAdapter } from '@/services/storage';
import type { StorageAdapter } from '@/services/storage';

import { SaveRepository } from '../saveRepository';

const FIXED_NOW = () => 1_700_000_000_000;

async function freshRepo() {
  const adapter = new MemoryStorageAdapter();
  const repo = new SaveRepository(adapter, FIXED_NOW);
  await repo.init();
  return { adapter, repo };
}

describe('save repository — normal axın', () => {
  it('boş database-də default profil yaradır', async () => {
    const { repo } = await freshRepo();
    const { save, recovered } = await repo.load();

    expect(recovered).toBe(false);
    expect(save.version).toBe(SAVE_SCHEMA_VERSION);
    expect(save.profile.coin).toBe(0);
    expect(save.progression.ownedMaterials).toEqual(['stretch-film']);
    expect(save.progression.tutorialCompleted).toBe(false);
  });

  it('yaz → oxu dövrəsi dəyəri qoruyur', async () => {
    const { repo } = await freshRepo();
    const { save } = await repo.load();

    save.profile.coin = 1234;
    save.profile.reputation = 250;
    save.progression.workshopLevel = 3;
    await repo.save(save);

    const reloaded = await repo.load();
    expect(reloaded.save.profile.coin).toBe(1234);
    expect(reloaded.save.profile.reputation).toBe(250);
    expect(reloaded.save.progression.workshopLevel).toBe(3);
    expect(reloaded.recovered).toBe(false);
  });

  it('reset default profilə qaytarır', async () => {
    const { repo } = await freshRepo();
    const { save } = await repo.load();
    save.profile.coin = 999;
    await repo.save(save);

    const reset = await repo.reset();
    expect(reset.profile.coin).toBe(0);
  });

  it('schema versiyası yazılır', async () => {
    const { adapter, repo } = await freshRepo();
    await repo.load();
    expect(await adapter.getSchemaVersion()).toBe(SAVE_SCHEMA_VERSION);
  });
});

describe('save repository — pozulmuş data (docs/DECISIONS.md §15)', () => {
  it('yanlış JSON tətbiqi ÇÖKDÜRMÜR', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.init();
    adapter.seedRaw(SAVE_KEY, '{ bu düzgün json deyil ');

    const repo = new SaveRepository(adapter, FIXED_NOW);
    const result = await repo.load();

    expect(result.recovered).toBe(true);
    expect(result.save.profile.coin).toBe(0);
  });

  it('struktur pozulubsa backup yaradılır və default qaytarılır', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.init();
    await adapter.set(SAVE_KEY, { version: 1, profile: 'bu obyekt olmalıydı' });

    const repo = new SaveRepository(adapter, FIXED_NOW);
    const result = await repo.load();

    expect(result.recovered).toBe(true);
    expect(adapter.keys().some((k) => k.startsWith('save_backup_'))).toBe(true);
  });

  it('gələcək versiyadan gələn save təhlükəsiz şəkildə əvəz edilir', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.init();
    await adapter.set(SAVE_KEY, { ...createDefaultSave(), version: 999 });

    const repo = new SaveRepository(adapter, FIXED_NOW);
    const result = await repo.load();

    expect(result.recovered).toBe(true);
    expect(result.save.version).toBe(SAVE_SCHEMA_VERSION);
  });

  it('null coin kimi qismən pozulmalar da tutulur', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.init();
    const broken = createDefaultSave();
    (broken.profile as unknown as { coin: unknown }).coin = null;
    await adapter.set(SAVE_KEY, broken);

    const repo = new SaveRepository(adapter, FIXED_NOW);
    expect((await repo.load()).recovered).toBe(true);
  });

  it('NaN dəyərləri etibarsız sayılır', () => {
    const broken = createDefaultSave();
    broken.profile.coin = NaN;
    expect(isValidSave(broken)).toBe(false);
  });

  it('düzgün save etibarlı sayılır', () => {
    expect(isValidSave(createDefaultSave())).toBe(true);
  });
});

describe('migration sistemi', () => {
  it('migration zənciri tamdır (v0 → cari versiya)', () => {
    expect(hasCompleteMigrationChain()).toBe(true);
  });

  it('v0-dan cari versiyaya keçir', () => {
    const migrated = runMigrations(null, 0);
    expect(migrated.version).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.profile).toBeDefined();
  });

  it('idempotentdir — iki dəfə işlətmək data pozmur', () => {
    const once = runMigrations(null, 0);
    const twice = runMigrations(once as unknown as Record<string, unknown>, once.version);
    expect(twice).toEqual(once);
  });

  it('cari versiyadakı data dəyişdirilmir', () => {
    const save = createDefaultSave();
    save.profile.coin = 500;
    const result = runMigrations(save as unknown as Record<string, unknown>, SAVE_SCHEMA_VERSION);
    expect(result.profile.coin).toBe(500);
  });

  it('hər migration ardıcıl versiya nömrəsinə malikdir', () => {
    const sorted = [...MIGRATIONS].sort((a, b) => a.from - b.from);
    sorted.forEach((m, i) => expect(m.from).toBe(i));
  });
});

describe('adapter uyğunluğu — hamısı eyni müqaviləni ödəyir', () => {
  const adapters: [string, () => StorageAdapter][] = [
    ['MemoryStorageAdapter', () => new MemoryStorageAdapter()],
    ['WebStorageAdapter', () => new WebStorageAdapter()],
  ];

  describe.each(adapters)('%s', (_name, factory) => {
    it('get / set / delete işləyir', async () => {
      const adapter = factory();
      await adapter.init();

      expect(await adapter.get('yoxdur')).toBeNull();

      await adapter.set('key', { a: 1 });
      expect(await adapter.get('key')).toEqual({ a: 1 });

      await adapter.delete('key');
      expect(await adapter.get('key')).toBeNull();
    });

    it('schema versiyası saxlanılır (default 0)', async () => {
      const adapter = factory();
      await adapter.init();

      expect(await adapter.getSchemaVersion()).toBe(0);
      await adapter.setSchemaVersion(2);
      expect(await adapter.getSchemaVersion()).toBe(2);
    });

    it('transaction xəta zamanı geri qaytarır', async () => {
      const adapter = factory();
      await adapter.init();
      await adapter.set('sabit', 'ilkin');

      await expect(
        adapter.transaction(async () => {
          await adapter.set('sabit', 'dəyişdi');
          throw new Error('uğursuz');
        }),
      ).rejects.toThrow('uğursuz');

      expect(await adapter.get('sabit')).toBe('ilkin');
    });

    it('eyni repository axını hər adapterdə işləyir', async () => {
      const adapter = factory();
      const repo = new SaveRepository(adapter, FIXED_NOW);
      await repo.init();

      const { save } = await repo.load();
      save.profile.reputation = 77;
      await repo.save(save);

      expect((await repo.load()).save.profile.reputation).toBe(77);
    });
  });
});
