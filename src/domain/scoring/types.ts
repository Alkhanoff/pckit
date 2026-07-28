import type {
  CustomerPriority,
  DefectInstance,
  ResultTier,
  SealPlacement,
  Suitability,
  ZoneId,
} from '@/types/game';

/**
 * Scoring girişi sessiyadan ayrıdır ki, testlər fixture-ləri
 * tam sessiya qurmadan birbaşa yarada bilsin (docs/BALANCE.md §13).
 */
export type ScoringInput = {
  zoneCoverage: Partial<Record<ZoneId, number>>;
  zoneWeights: Record<ZoneId, number>;
  sensitiveZones: ZoneId[];
  seal: SealPlacement;
  suitability: Suitability;
  materialUnitsUsed: number;
  targetMaterialUnits: number;
  defects: DefectInstance[];
  customerPriority: CustomerPriority;
};

export type ScoreResult = {
  presentation: number;
  protection: number;
  efficiency: number;
  overall: number;
  tier: ResultTier;
  openCriticalDefects: number;
  repairedDefects: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Ox balları tam ədəd kimi saxlanılır.
 *
 * Səbəb iki qatlıdır:
 *  1. Float qalığı (46.000000000000014) həm testləri, həm də UI-ni pozur.
 *  2. Result ekranında göstərilən bal ilə Perfect qapısında yoxlanılan bal
 *     EYNİ olmalıdır — "90 göstərib Perfect verməmək" qəbuledilməzdir.
 */
export function roundScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}
