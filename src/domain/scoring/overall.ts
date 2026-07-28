import { RESULT_THRESHOLDS, SCORE_WEIGHTS } from '@/config/balance';
import type { CustomerPriority, ResultTier } from '@/types/game';

import { calculateEfficiency } from './efficiency';
import { calculatePresentation } from './presentation';
import { calculateProtection } from './protection';
import type { ScoreResult, ScoringInput } from './types';

/**
 * Ümumi bal və nəticə səviyyəsi — docs/BALANCE.md §1.
 *
 * Çəkilər müştəri prioritetindən asılıdır, LAKİN Perfect qapısı çəkidən
 * asılı deyil — üç oxun minimumları bütün prioritetlərdə eynidir.
 */

export function calculateOverall(
  presentation: number,
  protection: number,
  efficiency: number,
  priority: CustomerPriority,
): number {
  const w = SCORE_WEIGHTS[priority];
  return Math.round(
    presentation * w.presentation + protection * w.protection + efficiency * w.efficiency,
  );
}

export function determineTier(
  overall: number,
  presentation: number,
  protection: number,
  efficiency: number,
  openCriticalDefects: number,
): ResultTier {
  const p = RESULT_THRESHOLDS.perfect;

  const isPerfect =
    overall >= p.overall &&
    presentation >= p.presentation &&
    protection >= p.protection &&
    efficiency >= p.efficiency &&
    openCriticalDefects === 0;

  if (isPerfect) return 'perfect';
  if (overall >= RESULT_THRESHOLDS.good.overall) return 'good';
  return 'acceptable';
}

export function calculateScore(input: ScoringInput): ScoreResult {
  const presentation = calculatePresentation(input.defects);
  const protection = calculateProtection(input);
  const efficiency = calculateEfficiency(input.materialUnitsUsed, input.targetMaterialUnits);

  const overall = calculateOverall(presentation, protection, efficiency, input.customerPriority);

  const openCriticalDefects = input.defects.filter(
    (d) => d.severity === 'critical' && !d.repaired,
  ).length;
  const repairedDefects = input.defects.filter((d) => d.repaired).length;

  return {
    presentation,
    protection,
    efficiency,
    overall,
    tier: determineTier(overall, presentation, protection, efficiency, openCriticalDefects),
    openCriticalDefects,
    repairedDefects,
  };
}
