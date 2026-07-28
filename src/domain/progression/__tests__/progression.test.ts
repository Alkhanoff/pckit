import { MATERIAL_PRICE, PREMIUM_CUSTOMER_REPUTATION } from '@/config/progression';
import {
  hasPremiumCustomers,
  milestonesUnlockedBetween,
  nextMilestone,
  progressToNextMilestone,
} from '@/domain/progression/reputation';
import {
  isMaterialVisible,
  isProductUnlocked,
  purchaseMaterial,
  purchaseWorkshopUpgrade,
  unlockedProducts,
  visibleMaterials,
} from '@/domain/progression/unlocks';

describe('məhsul unlock — YALNIZ reputasiya (docs/DECISIONS.md §10)', () => {
  it('başlanğıcda yalnız telefon qutusu açıqdır', () => {
    expect(unlockedProducts(0)).toEqual(['phone-box']);
  });

  it('reputasiya hədləri sənədlə uyğundur', () => {
    expect(isProductUnlocked('perfume', 99)).toBe(false);
    expect(isProductUnlocked('perfume', 100)).toBe(true);
    expect(isProductUnlocked('gift-box', 300)).toBe(true);
    expect(isProductUnlocked('food-tray', 599)).toBe(false);
    expect(isProductUnlocked('food-tray', 600)).toBe(true);
  });

  it('600 reputasiyada bütün məhsullar açıqdır', () => {
    expect(unlockedProducts(600)).toHaveLength(4);
  });
});

describe('material — reputasiya görünmə, coin alış', () => {
  it('bubble wrap 50 reputasiyadan əvvəl görünmür', () => {
    expect(isMaterialVisible('bubble-wrap', 49)).toBe(false);
    expect(isMaterialVisible('bubble-wrap', 50)).toBe(true);
  });

  it('streç film başlanğıcdan görünür və pulsuzdur', () => {
    expect(isMaterialVisible('stretch-film', 0)).toBe(true);
    expect(MATERIAL_PRICE['stretch-film']).toBe(0);
  });

  it('0 reputasiyada yalnız streç film görünür', () => {
    expect(visibleMaterials(0)).toEqual(['stretch-film']);
  });

  it('reputasiya kifayət etməsə alış rədd edilir', () => {
    const result = purchaseMaterial('bubble-wrap', {
      coin: 10_000,
      reputation: 10,
      ownedMaterials: ['stretch-film'],
    });
    expect(result).toEqual({ ok: false, reason: 'locked' });
  });

  it('coin kifayət etməsə alış rədd edilir və balans dəyişmir', () => {
    const result = purchaseMaterial('bubble-wrap', {
      coin: 499,
      reputation: 50,
      ownedMaterials: ['stretch-film'],
    });
    expect(result).toEqual({ ok: false, reason: 'insufficient-coin' });
  });

  it('şərtlər ödənəndə alış uğurludur', () => {
    const result = purchaseMaterial('bubble-wrap', {
      coin: 500,
      reputation: 50,
      ownedMaterials: ['stretch-film'],
    });
    expect(result).toEqual({ ok: true, coinSpent: 500 });
  });

  it('artıq sahib olunan material təkrar alınmır', () => {
    const result = purchaseMaterial('bubble-wrap', {
      coin: 10_000,
      reputation: 1000,
      ownedMaterials: ['stretch-film', 'bubble-wrap'],
    });
    expect(result).toEqual({ ok: false, reason: 'already-owned' });
  });
});

describe('workshop — YALNIZ coin, reputasiya tələb etmir', () => {
  it('Level 2 üçün 1500 coin lazımdır', () => {
    expect(purchaseWorkshopUpgrade({ coin: 1499, workshopLevel: 1 })).toEqual({
      ok: false,
      reason: 'insufficient-coin',
    });
    expect(purchaseWorkshopUpgrade({ coin: 1500, workshopLevel: 1 })).toEqual({
      ok: true,
      coinSpent: 1500,
    });
  });

  it('qiymət pilləsi 1500 → 3000 → 4500', () => {
    expect(purchaseWorkshopUpgrade({ coin: 99_999, workshopLevel: 2 })).toEqual({
      ok: true,
      coinSpent: 3000,
    });
    expect(purchaseWorkshopUpgrade({ coin: 99_999, workshopLevel: 3 })).toEqual({
      ok: true,
      coinSpent: 4500,
    });
  });

  it('maksimum səviyyədən yuxarı upgrade yoxdur', () => {
    expect(purchaseWorkshopUpgrade({ coin: 99_999, workshopLevel: 4 })).toEqual({
      ok: false,
      reason: 'max-level',
    });
  });
});

describe('reputasiya milestone-ları', () => {
  it('milestone-lar artan sıradadır', () => {
    const values = milestonesUnlockedBetween(0, 10_000).map((m) => m.reputation);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('0 → 50 keçidində bubble wrap açılır', () => {
    const unlocked = milestonesUnlockedBetween(0, 50);
    expect(unlocked.some((m) => m.id === 'bubble-wrap')).toBe(true);
  });

  it('reputasiya azalmırsa yeni milestone yoxdur', () => {
    expect(milestonesUnlockedBetween(100, 100)).toEqual([]);
    expect(milestonesUnlockedBetween(100, 50)).toEqual([]);
  });

  it('növbəti milestone düzgün tapılır', () => {
    expect(nextMilestone(0)?.reputation).toBe(50);
    expect(nextMilestone(50)?.reputation).toBe(100);
    expect(nextMilestone(10_000)).toBeUndefined();
  });

  it('irəliləmə 0–1 aralığındadır', () => {
    for (const rep of [0, 25, 50, 175, 600, 999, 5000]) {
      const progress = progressToNextMilestone(rep);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });

  it('premium müştərilər 1000 reputasiyada açılır', () => {
    expect(hasPremiumCustomers(PREMIUM_CUSTOMER_REPUTATION - 1)).toBe(false);
    expect(hasPremiumCustomers(PREMIUM_CUSTOMER_REPUTATION)).toBe(true);
  });
});
