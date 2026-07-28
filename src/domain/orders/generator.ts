import { ORDERS } from '@/config/gameplay';
import { FIXED_SEQUENCE, ORDER_POOL } from '@/data/orders';
import { getRecipe } from '@/data/recipes';
import type { OrderTemplate } from '@/types/definitions';

/**
 * Sifariş generatoru — docs/BALANCE.md §10.
 *
 * İlk `fixedSequenceLength` sifariş sabit ardıcıllıqdadır; sonra açılmış
 * recipe pool-undan seçilir. Eyni recipe ardıcıl iki dəfə təklif edilmir.
 *
 * Təsadüfilik xaricdən ötürülür (`random`) — testlər deterministik qalır.
 */

export type GeneratorState = {
  /** Neçə sifariş tamamlanıb — sabit ardıcıllıqdakı mövqeni müəyyən edir */
  completedCount: number;
  /** Sonuncu təklif edilmiş recipe — ardıcıl təkrarın qarşısını alır */
  lastRecipeId?: string;
};

function isUnlocked(template: OrderTemplate, unlockedRecipeIds: string[]): boolean {
  return unlockedRecipeIds.includes(template.recipeId);
}

/** Növbəti tək sifarişi seçir. */
export function nextOrder(
  state: GeneratorState,
  unlockedRecipeIds: string[],
  random: () => number = Math.random,
): OrderTemplate | undefined {
  // Sabit ardıcıllıq mərhələsi
  if (state.completedCount < ORDERS.fixedSequenceLength) {
    const fixed = FIXED_SEQUENCE[state.completedCount];
    if (fixed && isUnlocked(fixed, unlockedRecipeIds)) return fixed;
  }

  const available = ORDER_POOL.filter((o) => isUnlocked(o, unlockedRecipeIds));
  if (available.length === 0) return undefined;

  const candidates =
    ORDERS.preventConsecutiveRepeat && available.length > 1
      ? available.filter((o) => o.recipeId !== state.lastRecipeId)
      : available;

  const pool = candidates.length > 0 ? candidates : available;
  return pool[Math.floor(random() * pool.length) % pool.length];
}

/** Orders ekranı üçün eyni anda göstərilən sifariş dəsti. */
export function generateOrderBoard(
  state: GeneratorState,
  unlockedRecipeIds: string[],
  random: () => number = Math.random,
): OrderTemplate[] {
  const board: OrderTemplate[] = [];
  let cursor: GeneratorState = { ...state };

  for (let i = 0; i < ORDERS.visibleCount; i += 1) {
    const order = nextOrder(cursor, unlockedRecipeIds, random);
    if (!order) break;
    board.push(order);
    cursor = {
      completedCount: cursor.completedCount + 1,
      lastRecipeId: order.recipeId,
    };
  }

  return board;
}

/** Sifariş kartında göstərilən məlumat. */
export function describeOrder(template: OrderTemplate) {
  const recipe = getRecipe(template.recipeId);
  return {
    orderId: template.id,
    productId: recipe.productId,
    recommendedMaterialId: recipe.materialId,
    customerPriority: template.customerPriority,
    baseReward: recipe.baseReward,
    localizationKey: template.localizationKey,
    isTutorial: template.isTutorial ?? false,
  };
}
