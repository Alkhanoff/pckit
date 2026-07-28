import type { PackagingRecipe } from '@/types/definitions';

import type { PackagingSession } from '../gameplay/session';

import { calculateScore } from './overall';
import type { ScoreResult, ScoringInput } from './types';

export { calculateEfficiency, materialUnitsForDrag } from './efficiency';
export { calculateOverall, calculateScore, determineTier } from './overall';
export { calculatePresentation } from './presentation';
export { calculateProtection, calculateZoneCoverageScore } from './protection';
export type { ScoreResult, ScoringInput } from './types';

/** Aktiv sessiyanı recipe ilə birləşdirib scoring girişi qurur. */
export function buildScoringInput(
  session: PackagingSession,
  recipe: PackagingRecipe,
  sensitiveZones: ScoringInput['sensitiveZones'],
): ScoringInput {
  return {
    zoneCoverage: session.coverage,
    zoneWeights: recipe.zoneWeights,
    sensitiveZones,
    seal: session.seal.placement,
    suitability: session.suitability,
    materialUnitsUsed: session.materialUnitsUsed,
    targetMaterialUnits: recipe.targetMaterialUnits,
    defects: session.defects,
    customerPriority: session.customerPriority,
  };
}

export function scoreSession(
  session: PackagingSession,
  recipe: PackagingRecipe,
  sensitiveZones: ScoringInput['sensitiveZones'],
): ScoreResult {
  return calculateScore(buildScoringInput(session, recipe, sensitiveZones));
}
