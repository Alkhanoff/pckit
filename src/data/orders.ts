import type { OrderTemplate } from '@/types/definitions';

import { hasRecipe } from './recipes';

/**
 * Sifariş şablonları — docs/BALANCE.md §10.
 *
 * İlk 6 sifariş sabit ardıcıllıqdadır (öyrənmə əyrisi), sonra açılmış
 * recipe pool-undan təsadüfi seçilir.
 *
 * Recipe-i hələ hazırlanmamış şablonlar generator tərəfindən filtrlənir —
 * bu, yeni material əlavə edildikcə sifarişlərin avtomatik açılmasını təmin edir.
 */

export const ORDER_TEMPLATES: OrderTemplate[] = [
  {
    id: 'order-tutorial-phone-stretch',
    recipeId: 'phone-box__stretch-film',
    customerPriority: 'balanced',
    localizationKey: 'orders.tutorialPhoneStretch',
    sequenceIndex: 0,
    isTutorial: true,
  },
  {
    id: 'order-phone-bubble',
    recipeId: 'phone-box__bubble-wrap',
    customerPriority: 'protection',
    localizationKey: 'orders.phoneBubble',
    sequenceIndex: 1,
  },
  {
    id: 'order-perfume-bubble',
    recipeId: 'perfume__bubble-wrap',
    customerPriority: 'protection',
    localizationKey: 'orders.perfumeBubble',
    sequenceIndex: 2,
  },
  {
    id: 'order-gift-paper',
    recipeId: 'gift-box__premium-paper',
    customerPriority: 'presentation',
    localizationKey: 'orders.giftPaper',
    sequenceIndex: 3,
  },
  {
    id: 'order-food-foil',
    recipeId: 'food-tray__foil',
    customerPriority: 'protection',
    localizationKey: 'orders.foodFoil',
    sequenceIndex: 4,
  },
  {
    id: 'order-food-stretch',
    recipeId: 'food-tray__stretch-film',
    customerPriority: 'efficiency',
    localizationKey: 'orders.foodStretch',
    sequenceIndex: 5,
  },
];

/** Sabit ardıcıllıq — yalnız recipe-i mövcud olanlar. */
export const FIXED_SEQUENCE: OrderTemplate[] = ORDER_TEMPLATES.filter(
  (o) => o.sequenceIndex !== undefined && hasRecipe(o.recipeId),
).sort((a, b) => (a.sequenceIndex ?? 0) - (b.sequenceIndex ?? 0));

/** Təsadüfi pool — recipe-i mövcud olan bütün şablonlar. */
export const ORDER_POOL: OrderTemplate[] = ORDER_TEMPLATES.filter((o) => hasRecipe(o.recipeId));

export function getOrderTemplate(id: string): OrderTemplate | undefined {
  return ORDER_TEMPLATES.find((o) => o.id === id);
}
