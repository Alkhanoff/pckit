import {
  MATERIAL_PRICE,
  MATERIAL_REPUTATION_REQUIREMENT,
  MAX_WORKSHOP_LEVEL,
  PRODUCT_REPUTATION_REQUIREMENT,
  WORKSHOP_LEVEL_PRICE,
} from '@/config/progression';
import type { MaterialId, ProductId } from '@/types/game';

/**
 * Unlock məntiqi — docs/DECISIONS.md §10.
 *
 * Reputasiya kontentin GÖRÜNMƏSİNİ, coin isə SATIN ALINMASINI idarə edir.
 * Eyni kontent iki dəfə kilidlənmir:
 *   · məhsul sifarişləri — yalnız reputasiya
 *   · materiallar        — reputasiya (görünmə) + coin (alış)
 *   · workshop           — yalnız coin
 */

export type PurchaseResult =
  | { ok: true; coinSpent: number }
  | { ok: false; reason: 'locked' | 'insufficient-coin' | 'already-owned' | 'max-level' };

// ── Məhsullar ──────────────────────────────────────────────

export function isProductUnlocked(productId: ProductId, reputation: number): boolean {
  return reputation >= PRODUCT_REPUTATION_REQUIREMENT[productId];
}

export function unlockedProducts(reputation: number): ProductId[] {
  return (Object.keys(PRODUCT_REPUTATION_REQUIREMENT) as ProductId[]).filter((id) =>
    isProductUnlocked(id, reputation),
  );
}

// ── Materiallar ────────────────────────────────────────────

/** Material mağazada görünürmü (hələ alınmamış ola bilər). */
export function isMaterialVisible(materialId: MaterialId, reputation: number): boolean {
  return reputation >= MATERIAL_REPUTATION_REQUIREMENT[materialId];
}

export function visibleMaterials(reputation: number): MaterialId[] {
  return (Object.keys(MATERIAL_REPUTATION_REQUIREMENT) as MaterialId[]).filter((id) =>
    isMaterialVisible(id, reputation),
  );
}

export function purchaseMaterial(
  materialId: MaterialId,
  state: { coin: number; reputation: number; ownedMaterials: MaterialId[] },
): PurchaseResult {
  if (state.ownedMaterials.includes(materialId)) {
    return { ok: false, reason: 'already-owned' };
  }
  if (!isMaterialVisible(materialId, state.reputation)) {
    return { ok: false, reason: 'locked' };
  }

  const price = MATERIAL_PRICE[materialId];
  if (state.coin < price) {
    return { ok: false, reason: 'insufficient-coin' };
  }

  return { ok: true, coinSpent: price };
}

// ── Workshop ───────────────────────────────────────────────

export function workshopUpgradePrice(nextLevel: number): number | undefined {
  return WORKSHOP_LEVEL_PRICE[nextLevel];
}

export function purchaseWorkshopUpgrade(state: {
  coin: number;
  workshopLevel: number;
}): PurchaseResult {
  const nextLevel = state.workshopLevel + 1;

  if (nextLevel > MAX_WORKSHOP_LEVEL) {
    return { ok: false, reason: 'max-level' };
  }

  const price = workshopUpgradePrice(nextLevel);
  if (price === undefined) {
    return { ok: false, reason: 'max-level' };
  }
  if (state.coin < price) {
    return { ok: false, reason: 'insufficient-coin' };
  }

  return { ok: true, coinSpent: price };
}
