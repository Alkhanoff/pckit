import type { MaterialId, ProductId, ResultTier } from '@/types/game';

/**
 * NORMATIV PROGRESSION DƏYƏRLƏRİ
 * Mənbə: docs/BALANCE.md §7–9.
 *
 * Reputasiya kontentin *görünməsini*, coin isə *satın alınmasını* idarə edir.
 * Eyni kontent iki dəfə kilidlənmir — docs/DECISIONS.md §10.
 */

// ─────────────────────────────────────────────────────────────
// §7 — Mükafat
// ─────────────────────────────────────────────────────────────

export const RESULT_MULTIPLIER: Record<ResultTier, number> = {
  perfect: 1.5,
  good: 1.0,
  acceptable: 0.7,
};

export const BASE_REPUTATION = 10;

/** Müştərinin prioritet oxu bu baldan yuxarıdırsa coin bonusu verilir */
export const PRIORITY_BONUS_THRESHOLD = 90;
export const PRIORITY_BONUS_MULTIPLIER = 1.1;

// ─────────────────────────────────────────────────────────────
// §8 — Reputasiya hədləri
// ─────────────────────────────────────────────────────────────

/** Məhsul sifarişləri YALNIZ reputasiya ilə açılır — coin tələb etmir. */
export const PRODUCT_REPUTATION_REQUIREMENT: Record<ProductId, number> = {
  'phone-box': 0,
  perfume: 100,
  'gift-box': 300,
  'food-tray': 600,
};

/** Material bu reputasiyadan sonra mağazada GÖRÜNÜR (alınması ayrıca coin tələb edir). */
export const MATERIAL_REPUTATION_REQUIREMENT: Record<MaterialId, number> = {
  'stretch-film': 0,
  'bubble-wrap': 50,
  'premium-paper': 250,
  foil: 500,
};

/** Premium müştəri sifarişləri. Tuning namizədi — playtest uzun gələrsə 800. */
export const PREMIUM_CUSTOMER_REPUTATION = 1000;

// ─────────────────────────────────────────────────────────────
// §9 — Coin qiymətləri
// ─────────────────────────────────────────────────────────────

export const MATERIAL_PRICE: Record<MaterialId, number> = {
  'stretch-film': 0, // başlanğıcdan açıqdır
  'bubble-wrap': 500,
  'premium-paper': 1000,
  foil: 1500,
};

export const WORKSHOP_LEVEL_PRICE: Record<number, number> = {
  1: 0, // başlanğıc səviyyə
  2: 1500,
  3: 3000,
  4: 4500,
};

export const MAX_WORKSHOP_LEVEL = 4;

// ─────────────────────────────────────────────────────────────
// Başlanğıc vəziyyəti
// ─────────────────────────────────────────────────────────────

export const STARTING_COIN = 0;
export const STARTING_REPUTATION = 0;
export const STARTING_PRODUCTS: ProductId[] = ['phone-box'];
export const STARTING_MATERIALS: MaterialId[] = ['stretch-film'];
export const STARTING_WORKSHOP_LEVEL = 1;
