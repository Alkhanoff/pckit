import type { DefectInstance, SealPlacement, TensionState, ZoneId } from '@/types/game';

/**
 * Gesture qatından domain qatına keçən YEGANƏ məlumat forması.
 *
 * docs/DECISIONS.md §14 — davamlı koordinatlar UI thread-də qalır,
 * bura yalnız diskret hadisələr gəlir. `runOnJS` yalnız
 * `src/gestures/intentBridge.ts` faylında çağırılır.
 */

export type GameplayIntent =
  | { type: 'materialGrabbed' }
  | { type: 'materialReleased' }
  | { type: 'tensionStateChanged'; tension: TensionState }
  | {
      type: 'wrapZoneCompleted';
      zone: ZoneId;
      /** Bu keçiddən sonra zonanın örtülmə səviyyəsi (0–1+) */
      coverage: number;
      /** Zona sarınarkən orta tension — qırış triggeri */
      meanTension: TensionState;
      /** Drag path-ın yan sapması (zona eninə nisbətən) — hava qabarcığı triggeri */
      lateralDeviation: number;
      /** Bu zonaya sərf olunan material vahidi */
      unitsUsed: number;
    }
  | { type: 'wrapPassCompleted'; pass: number }
  | { type: 'cutCompleted' }
  | { type: 'sealPlaced'; placement: SealPlacement; angleDeg: number }
  | { type: 'inspectionCompleted' }
  | { type: 'defectDetected'; defect: DefectInstance }
  | { type: 'defectRepaired'; defectId: string }
  | { type: 'recipeCompleted' };

export type GameplayIntentType = GameplayIntent['type'];

/** docs/DECISIONS.md §14-dəki normativ siyahı — testlə qorunur. */
export const INTENT_TYPES: readonly GameplayIntentType[] = [
  'materialGrabbed',
  'materialReleased',
  'tensionStateChanged',
  'wrapZoneCompleted',
  'wrapPassCompleted',
  'cutCompleted',
  'sealPlaced',
  'inspectionCompleted',
  'defectDetected',
  'defectRepaired',
  'recipeCompleted',
];
