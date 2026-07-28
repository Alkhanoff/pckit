import {
  SEAL_MODIFIERS,
  SENSITIVE_ZONE_MIN_COVERAGE,
  SENSITIVE_ZONE_PENALTY,
  SUITABILITY_MULTIPLIER,
} from '@/config/balance';
import { ALL_ZONES } from '@/types/game';

import type { ScoringInput } from './types';
import { clamp, roundScore } from './types';

/**
 * Protection balı — docs/BALANCE.md §4.
 *
 *   zoneCoverage = Σ ( zoneWeight[i] × clamp(coverage[i], 0, 1) )
 *   protection   = clamp( (zoneCoverage + sealMod + sensitiveMod) × suitability, 0, 100 )
 *
 * Zona çəkilərinin cəmi 100 olduğu üçün tam örtülmə 100 bal verir.
 * Telefon qutusunda yalnız Pass 1 → 70 (Perfect üçün Pass 2 məcburidir).
 */

export function calculateZoneCoverageScore(
  zoneCoverage: ScoringInput['zoneCoverage'],
  zoneWeights: ScoringInput['zoneWeights'],
): number {
  let score = 0;
  for (const zone of ALL_ZONES) {
    const weight = zoneWeights[zone] ?? 0;
    if (weight === 0) continue;
    score += weight * clamp(zoneCoverage[zone] ?? 0, 0, 1);
  }
  return score;
}

export function calculateProtection(input: ScoringInput): number {
  const coverageScore = calculateZoneCoverageScore(input.zoneCoverage, input.zoneWeights);

  const sealModifier = SEAL_MODIFIERS[input.seal];

  const sensitiveModifier = input.sensitiveZones.reduce((sum, zone) => {
    const covered = input.zoneCoverage[zone] ?? 0;
    return covered < SENSITIVE_ZONE_MIN_COVERAGE ? sum + SENSITIVE_ZONE_PENALTY : sum;
  }, 0);

  const raw =
    (coverageScore + sealModifier + sensitiveModifier) * SUITABILITY_MULTIPLIER[input.suitability];

  return roundScore(raw);
}
