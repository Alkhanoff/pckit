import {
  MATERIAL_REPUTATION_REQUIREMENT,
  PREMIUM_CUSTOMER_REPUTATION,
  PRODUCT_REPUTATION_REQUIREMENT,
} from '@/config/progression';
import type { MaterialId, ProductId } from '@/types/game';

/**
 * Reputasiya — docs/DECISIONS.md §9.
 * Xərclənmir, yalnız artır.
 */

export type ReputationMilestone = {
  reputation: number;
  kind: 'product' | 'material' | 'customer-tier';
  id: ProductId | MaterialId | 'premium-customers';
};

const ALL_MILESTONES: ReputationMilestone[] = [
  ...(Object.entries(PRODUCT_REPUTATION_REQUIREMENT) as [ProductId, number][]).map(
    ([id, reputation]): ReputationMilestone => ({ reputation, kind: 'product', id }),
  ),
  ...(Object.entries(MATERIAL_REPUTATION_REQUIREMENT) as [MaterialId, number][]).map(
    ([id, reputation]): ReputationMilestone => ({ reputation, kind: 'material', id }),
  ),
  {
    reputation: PREMIUM_CUSTOMER_REPUTATION,
    kind: 'customer-tier',
    id: 'premium-customers',
  },
];

/** Reputasiya 0 olan başlanğıc kontenti milestone sayılmır. */
export const REPUTATION_MILESTONES: ReputationMilestone[] = ALL_MILESTONES.filter(
  (m) => m.reputation > 0,
).sort((a, b) => a.reputation - b.reputation);

/** Reputasiya artdıqda hansı yeni kontent açıldı. */
export function milestonesUnlockedBetween(before: number, after: number): ReputationMilestone[] {
  if (after <= before) return [];
  return REPUTATION_MILESTONES.filter((m) => m.reputation > before && m.reputation <= after);
}

export function nextMilestone(reputation: number): ReputationMilestone | undefined {
  return REPUTATION_MILESTONES.find((m) => m.reputation > reputation);
}

/** Növbəti hədəfə qədər irəliləmə: 0–1. */
export function progressToNextMilestone(reputation: number): number {
  const next = nextMilestone(reputation);
  if (!next) return 1;

  const previous = [...REPUTATION_MILESTONES]
    .reverse()
    .find((m) => m.reputation <= reputation)?.reputation;
  const floor = previous ?? 0;
  const span = next.reputation - floor;

  return span <= 0 ? 1 : (reputation - floor) / span;
}

export function hasPremiumCustomers(reputation: number): boolean {
  return reputation >= PREMIUM_CUSTOMER_REPUTATION;
}
