import { EFFICIENCY_CURVE, TENSION_MATERIAL_FACTOR } from '@/config/balance';
import type { TensionState } from '@/types/game';

import { roundScore } from './types';

/**
 * Efficiency balı — docs/BALANCE.md §5.
 *
 *   u = materialUnitsUsed / targetMaterialUnits
 *
 *   0.90 ≤ u ≤ 1.10 → 100
 *   1.10 < u ≤ 1.25 → 100 − ((u−1.10)/0.15) × 30      (u=1.25 → 70)
 *   u > 1.25        → max(0, 70 − ((u−1.25)/0.25) × 40) (u=1.50 → 30, u=1.75 → 0)
 *   u < 0.90        → max(40, 100 − ((0.90−u)/0.20) × 25) (u=0.70 → 75)
 *
 * Az material istifadəsi burada yumşaq cəzalanır, çünki coverage itkisi
 * `protection`-ı artıq sərt cəzalandırır — ikiqat cəza verilmir.
 */

export function calculateEfficiency(
  materialUnitsUsed: number,
  targetMaterialUnits: number,
): number {
  if (targetMaterialUnits <= 0) {
    throw new Error('targetMaterialUnits müsbət olmalıdır');
  }

  const u = materialUnitsUsed / targetMaterialUnits;
  const c = EFFICIENCY_CURVE;

  if (u >= c.optimalMin && u <= c.optimalMax) {
    return 100;
  }

  if (u > c.optimalMax && u <= c.kneeRatio) {
    const span = c.kneeRatio - c.optimalMax;
    return roundScore(100 - ((u - c.optimalMax) / span) * c.kneeDrop);
  }

  if (u > c.kneeRatio) {
    return roundScore(c.kneeScore - ((u - c.kneeRatio) / c.steepSpan) * c.steepDrop);
  }

  // u < optimalMin
  const under = 100 - ((c.optimalMin - u) / c.underSpan) * c.underDrop;
  return roundScore(Math.max(under, c.underFloor));
}

/**
 * Bir drag hərəkətinin sərf etdiyi material vahidi.
 *
 * Tension birbaşa sərfi dəyişir — ayrıca "tension cəzası" yoxdur, beləliklə
 * səbəb-nəticə zənciri təbii qalır: boş dartmaq daha çox material yeyir.
 */
export function materialUnitsForDrag(
  dragDelta: number,
  referenceDragDistance: number,
  tension: TensionState,
): number {
  if (referenceDragDistance <= 0) return 0;
  return (dragDelta / referenceDragDistance) * 100 * TENSION_MATERIAL_FACTOR[tension];
}
