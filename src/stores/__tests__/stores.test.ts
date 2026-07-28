import { RECIPE_PHONE_BOX_STRETCH_FILM } from '@/data/recipes';
import { useGameplayStore, resetGameplayStore } from '@/stores/useGameplayStore';
import { useInventoryStore, resetInventoryStore } from '@/stores/useInventoryStore';
import { useOrderStore, resetOrderStore } from '@/stores/useOrderStore';
import { useProfileStore, resetProfileStore } from '@/stores/useProfileStore';
import { useProgressionStore, resetProgressionStore } from '@/stores/useProgressionStore';
import { useSettingsStore, resetSettingsStore } from '@/stores/useSettingsStore';

beforeEach(() => {
  resetProfileStore();
  resetProgressionStore();
  resetSettingsStore();
  resetOrderStore();
  resetGameplayStore();
  resetInventoryStore();
});

describe('useProfileStore', () => {
  it('coin əlavə edir və xərcləyir', () => {
    const s = useProfileStore.getState();
    s.addCoin(500);
    expect(useProfileStore.getState().coin).toBe(500);

    expect(useProfileStore.getState().spendCoin(200)).toBe(true);
    expect(useProfileStore.getState().coin).toBe(300);
  });

  it('kifayət etməyən coin xərclənmir', () => {
    useProfileStore.getState().addCoin(100);
    expect(useProfileStore.getState().spendCoin(101)).toBe(false);
    expect(useProfileStore.getState().coin).toBe(100);
  });

  it('mənfi məbləğ balansı pozmur', () => {
    useProfileStore.getState().addCoin(-50);
    expect(useProfileStore.getState().coin).toBe(0);
    expect(useProfileStore.getState().spendCoin(-10)).toBe(false);
  });

  it('reputasiya XƏRCLƏNMİR — yalnız artır', () => {
    const s = useProfileStore.getState();
    s.addReputation(30);
    s.addReputation(-100);
    expect(useProfileStore.getState().reputation).toBe(30);
    expect('spendReputation' in s).toBe(false);
  });

  it('statistikanı qeyd edir', () => {
    useProfileStore.getState().recordOrderCompleted(true);
    useProfileStore.getState().recordOrderCompleted(false);
    const { ordersCompleted, perfectCount } = useProfileStore.getState();
    expect(ordersCompleted).toBe(2);
    expect(perfectCount).toBe(1);
  });

  it('hydrate/toData dövrəsi dəyəri qoruyur', () => {
    const data = { coin: 42, reputation: 7, ordersCompleted: 3, perfectCount: 1 };
    useProfileStore.getState().hydrate(data);
    expect(useProfileStore.getState().toData()).toEqual(data);
  });
});

describe('useProgressionStore', () => {
  it('başlanğıcda yalnız telefon qutusu və streç film var', () => {
    const s = useProgressionStore.getState();
    expect(s.unlockedProducts).toEqual(['phone-box']);
    expect(s.ownedMaterials).toEqual(['stretch-film']);
    expect(s.tutorialCompleted).toBe(false);
  });

  it('reputasiya ilə məhsulları sinxronlaşdırır', () => {
    useProgressionStore.getState().syncProductsWithReputation(300);
    expect(useProgressionStore.getState().unlockedProducts).toContain('gift-box');
    expect(useProgressionStore.getState().unlockedProducts).not.toContain('food-tray');
  });

  it('eyni material iki dəfə əlavə edilmir', () => {
    const s = useProgressionStore.getState();
    s.addMaterial('bubble-wrap');
    useProgressionStore.getState().addMaterial('bubble-wrap');
    expect(useProgressionStore.getState().ownedMaterials).toEqual(['stretch-film', 'bubble-wrap']);
  });

  it('tutorial restart sabit ardıcıllığı sıfırlayır', () => {
    const s = useProgressionStore.getState();
    s.completeTutorial();
    useProgressionStore.getState().advanceFixedOrder();
    expect(useProgressionStore.getState().tutorialCompleted).toBe(true);

    useProgressionStore.getState().restartTutorial();
    expect(useProgressionStore.getState().tutorialCompleted).toBe(false);
    expect(useProgressionStore.getState().fixedOrderIndex).toBe(0);
  });
});

describe('useSettingsStore', () => {
  it('default olaraq hər şey aktivdir, reduceMotion isə yox', () => {
    const s = useSettingsStore.getState();
    expect([s.music, s.sound, s.haptics]).toEqual([true, true, true]);
    expect(s.reduceMotion).toBe(false);
  });

  it('hər açarı ayrıca söndürür', () => {
    useSettingsStore.getState().toggle('haptics');
    expect(useSettingsStore.getState().haptics).toBe(false);
    expect(useSettingsStore.getState().sound).toBe(true);
  });
});

describe('useGameplayStore', () => {
  it('sessiya yaradır və hazır vəziyyətə gətirir', () => {
    useGameplayStore.getState().start({
      sessionId: 's1',
      recipe: RECIPE_PHONE_BOX_STRETCH_FILM,
      customerPriority: 'balanced',
      isTutorial: true,
    });
    expect(useGameplayStore.getState().session?.state).toBe('preparing');

    useGameplayStore.getState().ready();
    expect(useGameplayStore.getState().session?.state).toBe('selectingMaterial');
  });

  it('intent-ləri state machine vasitəsilə tətbiq edir', () => {
    useGameplayStore.getState().start({
      sessionId: 's2',
      recipe: RECIPE_PHONE_BOX_STRETCH_FILM,
      customerPriority: 'balanced',
    });
    useGameplayStore.getState().ready();
    useGameplayStore.getState().dispatch({ type: 'materialGrabbed' });

    expect(useGameplayStore.getState().session?.state).toBe('grabbingMaterial');
  });

  it('sessiya olmadan dispatch crash etmir', () => {
    expect(() => useGameplayStore.getState().dispatch({ type: 'materialGrabbed' })).not.toThrow();
  });

  it('end sessiyanı təmizləyir', () => {
    useGameplayStore.getState().start({
      sessionId: 's3',
      recipe: RECIPE_PHONE_BOX_STRETCH_FILM,
      customerPriority: 'balanced',
    });
    useGameplayStore.getState().end();
    expect(useGameplayStore.getState().session).toBeUndefined();
  });
});

describe('useOrderStore', () => {
  it('board-u açılmış recipe-lərdən doldurur', () => {
    useOrderStore
      .getState()
      .refreshBoard({ completedCount: 0 }, [RECIPE_PHONE_BOX_STRETCH_FILM.id]);
    expect(useOrderStore.getState().board.length).toBeGreaterThan(0);
  });

  it('sifariş seçimi əvvəlki material seçimini təmizləyir', () => {
    const s = useOrderStore.getState();
    s.selectMaterial('bubble-wrap');
    s.selectOrder({
      id: 'o1',
      recipeId: RECIPE_PHONE_BOX_STRETCH_FILM.id,
      customerPriority: 'balanced',
      localizationKey: 'x',
    });
    expect(useOrderStore.getState().selectedMaterialId).toBeUndefined();
  });
});

describe('useInventoryStore — MVP-də gameplay-i bloklamır', () => {
  it('ehtiyat mənfiyə düşmür', () => {
    const s = useInventoryStore.getState();
    s.refill('stretch-film', 10);
    useInventoryStore.getState().consume('stretch-film', 50);
    expect(useInventoryStore.getState().stock['stretch-film']).toBe(0);
  });

  it('mövcud olmayan materialın sərfi crash etmir', () => {
    expect(() => useInventoryStore.getState().consume('foil', 5)).not.toThrow();
    expect(useInventoryStore.getState().stock.foil).toBe(0);
  });
});
