import { DEFECT_TRIGGERS, REPAIR_CRITERIA } from '@/config/balance';
import type {
  DefectInstance,
  DefectSeverity,
  DefectType,
  TensionState,
  ZoneId,
} from '@/types/game';

/**
 * Qüsur yaranma qaydaları — docs/BALANCE.md §6.
 *
 * Bütün triggerlər DETERMİNİSTİKDİR. MVP-də təsadüfi qüsur yoxdur
 * (`randomDefectChance = 0`) — oyunçu qüsurun səbəbini başa düşməlidir.
 */

let defectCounter = 0;

/** Test təkrarlanabilirliyi üçün sayğacı sıfırlayır. */
export function resetDefectIds(): void {
  defectCounter = 0;
}

export function createDefect(
  type: DefectType,
  severity: DefectSeverity,
  extra: { zone?: ZoneId; magnitude?: number } = {},
): DefectInstance {
  defectCounter += 1;
  return {
    id: `${type}-${defectCounter}`,
    type,
    severity,
    repaired: false,
    ...extra,
  };
}

export type ZoneCompletionSignal = {
  zone: ZoneId;
  coverage: number;
  meanTension: TensionState;
  lateralDeviation: number;
};

/** Bir zona tamamlandıqda hansı qüsurların yarandığını hesablayır. */
export function detectZoneDefects(signal: ZoneCompletionSignal): DefectInstance[] {
  const defects: DefectInstance[] = [];
  const t = DEFECT_TRIGGERS;

  // Zəif dartılma → qırış
  if (signal.meanTension === 'loose') {
    defects.push(createDefect('wrinkle', 'minor', { zone: signal.zone }));
  }

  // Qeyri-bərabər drag → hava qabarcığı
  if (signal.lateralDeviation > t.airBubbleLateralDeviation) {
    defects.push(createDefect('airBubble', 'minor', { zone: signal.zone }));
  }

  // Yarımçıq zona → açıq künc
  if (signal.coverage < t.openCornerMaxCoverage) {
    const severity: DefectSeverity =
      signal.coverage < t.openCornerCriticalBelow ? 'critical' : 'minor';
    defects.push(createDefect('openCorner', severity, { zone: signal.zone }));
  }

  return defects;
}

/** Overstretch fasiləsiz bu qədər davam edibsə `thinFilm` yaranır. */
export function shouldCreateThinFilm(overstretchHeldSeconds: number): boolean {
  return overstretchHeldSeconds >= DEFECT_TRIGGERS.thinFilmHoldSeconds;
}

/** Kəsimdən sonra seal vəziyyətinə görə qüsur. */
export function detectSealDefects(
  placement: 'correct' | 'wrong-zone' | 'missing',
  angleDeg: number,
): DefectInstance[] {
  const defects: DefectInstance[] = [];

  if (placement === 'missing') {
    defects.push(createDefect('looseEnd', 'critical'));
    return defects;
  }

  if (placement === 'wrong-zone') {
    defects.push(createDefect('looseEnd', 'minor'));
  }

  if (Math.abs(angleDeg) > DEFECT_TRIGGERS.crookedSealAngleDeg) {
    defects.push(createDefect('crookedSeal', 'minor'));
  }

  return defects;
}

/** Sessiya sonunda material və coverage əsaslı qüsurlar. */
export function detectFinalDefects(input: {
  materialRatio: number;
  weightedCoverage: number;
}): DefectInstance[] {
  const defects: DefectInstance[] = [];

  if (input.materialRatio > DEFECT_TRIGGERS.excessMaterialRatio) {
    defects.push(createDefect('excessMaterial', 'minor'));
  }

  if (input.weightedCoverage < DEFECT_TRIGGERS.criticalCoverageBelow) {
    defects.push(createDefect('coverageCritical', 'critical'));
  }

  return defects;
}

/** Düzəltmə gesture-inin uğurlu sayılıb-sayılmadığı. */
export function isRepairSuccessful(
  type: DefectType,
  measurement: { overlap?: number; distance?: number; angleDeg?: number; coverage?: number },
): boolean {
  const c = REPAIR_CRITERIA;

  switch (type) {
    case 'wrinkle':
      return (measurement.overlap ?? 0) >= c.wrinkleSwipeOverlap;
    case 'airBubble':
      return (measurement.distance ?? 0) >= c.airBubbleDragDistance;
    case 'openCorner':
      return (measurement.coverage ?? 0) >= c.openCornerTargetCoverage;
    case 'crookedSeal':
    case 'crookedLabel':
    case 'crookedStamp':
      return Math.abs(measurement.angleDeg ?? 999) <= c.crookedSealMaxAngleDeg;
    case 'looseEnd':
    case 'excessMaterial':
      // Boş uc və artıq material yenidən yerləşdirmə/kəsimlə düzəlir —
      // ayrıca ölçü tələb olunmur, gesture-in özü kifayətdir.
      return true;
    default:
      return false;
  }
}
