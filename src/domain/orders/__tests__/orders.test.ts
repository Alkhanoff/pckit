import { ORDERS } from '@/config/gameplay';
import { FIXED_SEQUENCE, ORDER_POOL, ORDER_TEMPLATES } from '@/data/orders';
import { RECIPE_PHONE_BOX_STRETCH_FILM, hasRecipe } from '@/data/recipes';
import { describeOrder, generateOrderBoard, nextOrder } from '@/domain/orders/generator';
import { calculateRewards, hasPriorityBonus } from '@/domain/orders/rewards';
import type { ScoreResult } from '@/domain/scoring';

const UNLOCKED = [RECIPE_PHONE_BOX_STRETCH_FILM.id];

function score(overrides: Partial<ScoreResult> = {}): ScoreResult {
  return {
    presentation: 95,
    protection: 95,
    efficiency: 95,
    overall: 95,
    tier: 'perfect',
    openCriticalDefects: 0,
    repairedDefects: 0,
    ...overrides,
  };
}

describe('sifariş data-sı', () => {
  it('ilk sifariş tutorial-dır və telefon qutusu + streç filmdir', () => {
    const first = ORDER_TEMPLATES.find((o) => o.sequenceIndex === 0);
    expect(first?.isTutorial).toBe(true);
    expect(first?.recipeId).toBe('phone-box__stretch-film');
  });

  it('sabit ardıcıllıq yalnız MÖVCUD recipe-ləri saxlayır', () => {
    for (const order of FIXED_SEQUENCE) {
      expect(hasRecipe(order.recipeId)).toBe(true);
    }
  });

  it('hazırlanmamış recipe-lər pool-a düşmür', () => {
    // MVP-də yalnız bir recipe var — qalan şablonlar filtrlənməlidir
    expect(ORDER_POOL).toHaveLength(1);
    expect(ORDER_TEMPLATES.length).toBeGreaterThan(ORDER_POOL.length);
  });

  it('sequenceIndex-lər unikaldır', () => {
    const indices = ORDER_TEMPLATES.map((o) => o.sequenceIndex).filter((i) => i !== undefined);
    expect(new Set(indices).size).toBe(indices.length);
  });
});

describe('sifariş generatoru', () => {
  it('ilk sifariş sabit ardıcıllıqdan gəlir', () => {
    const order = nextOrder({ completedCount: 0 }, UNLOCKED, () => 0);
    expect(order?.isTutorial).toBe(true);
  });

  it('açılmamış recipe seçilmir', () => {
    expect(nextOrder({ completedCount: 0 }, [], () => 0)).toBeUndefined();
  });

  it('board konfiqurasiyadakı sayı keçmir', () => {
    const board = generateOrderBoard({ completedCount: 0 }, UNLOCKED, () => 0);
    expect(board.length).toBeLessThanOrEqual(ORDERS.visibleCount);
  });

  it('board-da eyni sifariş TƏKRARLANMIR', () => {
    const board = generateOrderBoard({ completedCount: 0 }, UNLOCKED, () => 0);
    const ids = board.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tək recipe açıq olduqda board bir sifarişlə qısa qalır', () => {
    // Süni təkrar əvəzinə dürüst qısa siyahı göstərilir
    const board = generateOrderBoard({ completedCount: 0 }, UNLOCKED, () => 0);
    expect(board).toHaveLength(1);
  });

  it('tək recipe olduqda təkrar qadağası kilidlənməyə səbəb olmur', () => {
    const order = nextOrder(
      { completedCount: 10, lastRecipeId: RECIPE_PHONE_BOX_STRETCH_FILM.id },
      UNLOCKED,
      () => 0,
    );
    expect(order).toBeDefined();
  });

  it('təsadüfilik xaricdən ötürülür — nəticə deterministikdir', () => {
    const a = nextOrder({ completedCount: 10 }, UNLOCKED, () => 0.42);
    const b = nextOrder({ completedCount: 10 }, UNLOCKED, () => 0.42);
    expect(a?.id).toBe(b?.id);
  });

  it('sifariş kartı lazımi məlumatları verir', () => {
    const described = describeOrder(FIXED_SEQUENCE[0]);
    expect(described).toMatchObject({
      productId: 'phone-box',
      recommendedMaterialId: 'stretch-film',
      baseReward: 100,
      isTutorial: true,
    });
  });
});

describe('mükafat hesablaması (docs/BALANCE.md §7)', () => {
  it('nəticə multiplikatorları düzgündür', () => {
    expect(calculateRewards(score({ tier: 'perfect' }), 100, 'balanced').reputation).toBe(15);
    expect(calculateRewards(score({ tier: 'good' }), 100, 'balanced').reputation).toBe(10);
    expect(calculateRewards(score({ tier: 'acceptable' }), 100, 'balanced').reputation).toBe(7);
  });

  it('balanslı müştəri bonusu yalnız hər üç ox ≥ 90 olduqda verir', () => {
    expect(hasPriorityBonus(score({ presentation: 89 }), 'balanced')).toBe(false);
    expect(hasPriorityBonus(score(), 'balanced')).toBe(true);
  });

  it('prioritetli müştəri yalnız öz oxuna baxır', () => {
    const lopsided = score({ presentation: 100, protection: 40, efficiency: 40 });
    expect(hasPriorityBonus(lopsided, 'presentation')).toBe(true);
    expect(hasPriorityBonus(lopsided, 'protection')).toBe(false);
    expect(hasPriorityBonus(lopsided, 'efficiency')).toBe(false);
  });

  it('bonus coin-i 10% artırır', () => {
    const withBonus = calculateRewards(score(), 200, 'balanced');
    const withoutBonus = calculateRewards(score({ presentation: 50 }), 200, 'balanced');
    expect(withBonus.coin).toBe(330);
    expect(withoutBonus.coin).toBe(300);
  });

  it('baza mükafatı 0 olan sifariş 0 coin verir', () => {
    expect(calculateRewards(score(), 0, 'balanced').coin).toBe(0);
  });
});

describe('board təkrarsızlığı — hər vəziyyətdə', () => {
  const ALL_RECIPE_IDS = ORDER_TEMPLATES.map((o) => o.recipeId);

  it('istənilən completedCount və unlock kombinasiyasında id-lər unikaldır', () => {
    for (let completed = 0; completed <= 12; completed += 1) {
      for (const unlocked of [[], UNLOCKED, ALL_RECIPE_IDS]) {
        for (const r of [0, 0.33, 0.5, 0.99]) {
          const board = generateOrderBoard({ completedCount: completed }, unlocked, () => r);
          const ids = board.map((o) => o.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      }
    }
  });

  it('lastRecipeId nə olursa olsun təkrar yaranmır', () => {
    for (const last of [undefined, ...ALL_RECIPE_IDS]) {
      const board = generateOrderBoard(
        { completedCount: 2, lastRecipeId: last },
        UNLOCKED,
        () => 0,
      );
      const ids = board.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
