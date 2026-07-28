/**
 * Oyunun əsas identifikator və union tipləri.
 * Bu fayl heç bir platform kodu import etmir.
 */

export type ProductId = 'phone-box' | 'perfume' | 'gift-box' | 'food-tray';

export type MaterialId = 'stretch-film' | 'bubble-wrap' | 'premium-paper' | 'foil';

export type ZoneId = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export const ALL_ZONES: readonly ZoneId[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];

/** docs/BALANCE.md §2 */
export type TensionState = 'loose' | 'optimal' | 'overstretched';

/** docs/BALANCE.md §1 — scoring çəki dəstini seçir */
export type CustomerPriority = 'balanced' | 'protection' | 'presentation' | 'efficiency';

/** docs/DECISIONS.md §6 */
export type ResultTier = 'perfect' | 'good' | 'acceptable';

/** docs/DECISIONS.md §5 — recipe-in sifarişin məqsədinə uyğunluğu */
export type Suitability = 'ideal' | 'alternative' | 'poor';

/** docs/BALANCE.md §4 */
export type SealPlacement = 'correct' | 'wrong-zone' | 'missing';

/** docs/BALANCE.md §6 */
export type DefectType =
  | 'wrinkle'
  | 'airBubble'
  | 'openCorner'
  | 'looseEnd'
  | 'crookedSeal'
  | 'crookedLabel'
  | 'crookedStamp'
  | 'thinFilm'
  | 'excessMaterial'
  | 'asymmetry'
  | 'coverageCritical';

/** docs/DECISIONS.md §7 */
export type DefectSeverity = 'minor' | 'critical';

export type DefectInstance = {
  id: string;
  type: DefectType;
  severity: DefectSeverity;
  /** Hansı zonada yarandı (varsa) */
  zone?: ZoneId;
  /** Davamlı qüsurlar üçün cəza dəyəri (yalnız `asymmetry`) */
  magnitude?: number;
  repaired: boolean;
};

/** docs/ARCHITECTURE.md §3 */
export type GameplayState =
  | 'preparing'
  | 'selectingMaterial'
  | 'grabbingMaterial'
  | 'pulling'
  | 'wrapping'
  | 'cutting'
  | 'sealing'
  | 'inspecting'
  | 'repairing'
  | 'completed'
  | 'result';

export type ZoneRecord = Partial<Record<ZoneId, number>>;
