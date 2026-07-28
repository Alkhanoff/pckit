import { SAVE_KEY } from '@/database/schema';
import { MemoryStorageAdapter } from '@/services/storage';
import { useInventoryStore, resetInventoryStore } from '@/stores/useInventoryStore';
import { useProfileStore, resetProfileStore } from '@/stores/useProfileStore';
import { useProgressionStore, resetProgressionStore } from '@/stores/useProgressionStore';
import { useSettingsStore, resetSettingsStore } from '@/stores/useSettingsStore';

import { collectSave, isSaveReady, loadSave, persistSave, resetSaveService } from '../saveService';

function resetAll() {
  resetSaveService();
  resetProfileStore();
  resetProgressionStore();
  resetSettingsStore();
  resetInventoryStore();
}

beforeEach(resetAll);

describe('save service — açılış', () => {
  it('boş yaddaşda default profil yükləyir və store-ları doldurur', async () => {
    const adapter = new MemoryStorageAdapter();
    await loadSave(adapter);

    expect(isSaveReady()).toBe(true);
    expect(useProfileStore.getState().coin).toBe(0);
    expect(useProgressionStore.getState().ownedMaterials).toEqual(['stretch-film']);
    expect(useSettingsStore.getState().sound).toBe(true);
  });

  it('mövcud save-i store-lara yükləyir', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.init();
    await adapter.set(SAVE_KEY, {
      version: 1,
      profile: { coin: 750, reputation: 120, ordersCompleted: 9, perfectCount: 4 },
      progression: {
        unlockedProducts: ['phone-box', 'perfume'],
        ownedMaterials: ['stretch-film', 'bubble-wrap'],
        workshopLevel: 2,
        tutorialCompleted: true,
        fixedOrderIndex: 3,
      },
      settings: {
        music: false,
        sound: true,
        haptics: false,
        reduceMotion: true,
        locale: 'en',
      },
      inventory: {},
    });

    await loadSave(adapter);

    expect(useProfileStore.getState().coin).toBe(750);
    expect(useProgressionStore.getState().workshopLevel).toBe(2);
    expect(useProgressionStore.getState().tutorialCompleted).toBe(true);
    expect(useSettingsStore.getState().music).toBe(false);
    expect(useSettingsStore.getState().reduceMotion).toBe(true);
  });

  it('pozulmuş save tətbiqi çökdürmür', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.init();
    adapter.seedRaw(SAVE_KEY, 'bu json deyil');

    await expect(loadSave(adapter)).resolves.toBeDefined();
    expect(useProfileStore.getState().coin).toBe(0);
  });
});

describe('save service — yazma', () => {
  it('store dəyişikliyi diskə yazılır və yenidən yüklənir', async () => {
    const adapter = new MemoryStorageAdapter();
    await loadSave(adapter);

    useProfileStore.getState().addCoin(320);
    useProfileStore.getState().addReputation(55);
    useSettingsStore.getState().toggle('haptics');
    await persistSave();

    // Store-ları sıfırla, yalnız diskdən oxu
    resetProfileStore();
    resetSettingsStore();
    resetSaveService();
    await loadSave(adapter);

    expect(useProfileStore.getState().coin).toBe(320);
    expect(useProfileStore.getState().reputation).toBe(55);
    expect(useSettingsStore.getState().haptics).toBe(false);
  });

  it('save hazır olmadan yazma cəhdi mövcud data-nı POZMUR', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.init();
    await adapter.set(SAVE_KEY, {
      version: 1,
      profile: { coin: 9999, reputation: 500, ordersCompleted: 40, perfectCount: 20 },
      progression: {
        unlockedProducts: ['phone-box'],
        ownedMaterials: ['stretch-film'],
        workshopLevel: 1,
        tutorialCompleted: true,
        fixedOrderIndex: 0,
      },
      settings: { music: true, sound: true, haptics: true, reduceMotion: false, locale: 'en' },
      inventory: {},
    });

    // loadSave çağırılmadan persist — sıfır store diskə yazılmamalıdır
    await persistSave();

    await loadSave(adapter);
    expect(useProfileStore.getState().coin).toBe(9999);
  });

  it('collectSave bütün store-ları toplayır', async () => {
    const adapter = new MemoryStorageAdapter();
    await loadSave(adapter);

    useProfileStore.getState().addCoin(10);
    useProgressionStore.getState().addMaterial('bubble-wrap');
    useInventoryStore.getState().refill('stretch-film', 5);

    const collected = collectSave();
    expect(collected.profile.coin).toBe(10);
    expect(collected.progression.ownedMaterials).toContain('bubble-wrap');
    expect(collected.inventory['stretch-film']).toBe(5);
    expect(collected.version).toBe(1);
  });
});
