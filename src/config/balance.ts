import type {
  CustomerPriority,
  DefectType,
  SealPlacement,
  Suitability,
  TensionState,
} from '@/types/game';

/**
 * NORMATIV BALANS DƏYƏRLƏRİ
 *
 * Mənbə: docs/BALANCE.md §1–6.
 * Burada olmayan rəqəm heç bir komponentdə görünməməlidir.
 * Dəyişiklik proseduru: docs/BALANCE.md → bu fayl → testlər → commit.
 */

// ─────────────────────────────────────────────────────────────
// §1 — Overall score
// ─────────────────────────────────────────────────────────────

export type ScoreWeights = {
  presentation: number;
  protection: number;
  efficiency: number;
};

/** Müştəri prioritetinə görə çəki dəstləri. Hər dəstin cəmi 1.00-dir. */
export const SCORE_WEIGHTS: Record<CustomerPriority, ScoreWeights> = {
  balanced: { presentation: 0.35, protection: 0.4, efficiency: 0.25 },
  protection: { presentation: 0.25, protection: 0.55, efficiency: 0.2 },
  presentation: { presentation: 0.5, protection: 0.3, efficiency: 0.2 },
  efficiency: { presentation: 0.25, protection: 0.35, efficiency: 0.4 },
};

/**
 * Perfect qapısı çəkidən asılı deyil — minimumlar bütün prioritetlərdə eynidir.
 * Səbəb: prioritetdən asılı olmayaraq keyfiyyətli iş tələb olunsun.
 */
export const RESULT_THRESHOLDS = {
  perfect: {
    overall: 90,
    presentation: 90,
    protection: 90,
    efficiency: 85,
  },
  good: {
    overall: 70,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// §2 — Tension
// ─────────────────────────────────────────────────────────────

/** loose: t < 0.35 · optimal: 0.35 ≤ t ≤ 0.75 · overstretched: t > 0.75 */
export const TENSION_BANDS = {
  looseMax: 0.35,
  optimalMax: 0.75,
} as const;

export const TENSION_DEBOUNCE_MS = 120;
export const OVERSTRETCH_WARNING_COOLDOWN_MS = 2000;

/** Tension birbaşa material sərfini dəyişir — ayrıca tension cəzası yoxdur. */
export const TENSION_MATERIAL_FACTOR: Record<TensionState, number> = {
  loose: 1.35,
  optimal: 1.0,
  overstretched: 0.85,
};

// ─────────────────────────────────────────────────────────────
// §3 — Presentation
// ─────────────────────────────────────────────────────────────

/** Düzəldilmiş qüsurun qalıq cəzası — 80%-i geri qaytarılır. */
export const REPAIR_RESIDUAL = 0.2;

export type DefectPenaltyConfig = {
  /** Baza cəza (asymmetry üçün maksimum — faktiki dəyər `magnitude`-dən gəlir) */
  penalty: number;
  /** Cəza limiti eyni qrupdakı qüsurlar arasında paylaşılır */
  group: string;
};

export const DEFECT_PENALTIES: Record<DefectType, DefectPenaltyConfig> = {
  wrinkle: { penalty: 4, group: 'wrinkle' },
  airBubble: { penalty: 5, group: 'airBubble' },
  openCorner: { penalty: 6, group: 'openCorner' },
  looseEnd: { penalty: 8, group: 'looseEnd' },
  crookedSeal: { penalty: 6, group: 'crooked' },
  crookedLabel: { penalty: 6, group: 'crooked' },
  crookedStamp: { penalty: 6, group: 'crooked' },
  thinFilm: { penalty: 5, group: 'thinFilm' },
  excessMaterial: { penalty: 5, group: 'excessMaterial' },
  asymmetry: { penalty: 10, group: 'asymmetry' },
  // Coverage kritikliyi protection tərəfində artıq hesablanır —
  // presentation-da ikiqat cəza verilmir, yalnız Perfect-i bloklayır.
  coverageCritical: { penalty: 0, group: 'coverageCritical' },
};

/** Bir qrupdan maksimum neçə qüsurun cəzası sayılır. */
export const DEFECT_GROUP_CAPS: Record<string, number> = {
  wrinkle: 5,
  airBubble: 4,
  openCorner: 3,
  looseEnd: 2,
  crooked: 3,
  thinFilm: 2,
  excessMaterial: 1,
  asymmetry: 1,
  coverageCritical: 1,
};

// ─────────────────────────────────────────────────────────────
// §4 — Protection
// ─────────────────────────────────────────────────────────────

export const SEAL_MODIFIERS: Record<SealPlacement, number> = {
  correct: 0,
  'wrong-zone': -10,
  missing: -25,
};

/** Hər qorunmamış həssas zona üçün cəza */
export const SENSITIVE_ZONE_PENALTY = -15;

/** Həssas zona bu coverage-dən aşağıdırsa qorunmamış sayılır */
export const SENSITIVE_ZONE_MIN_COVERAGE = 0.5;

export const SUITABILITY_MULTIPLIER: Record<Suitability, number> = {
  ideal: 1.0,
  alternative: 0.9,
  poor: 0.75,
};

// ─────────────────────────────────────────────────────────────
// §5 — Efficiency
// ─────────────────────────────────────────────────────────────

export const EFFICIENCY_CURVE = {
  /** Bu aralıqda tam bal */
  optimalMin: 0.9,
  optimalMax: 1.1,

  /** optimalMax → knee arasında yumşaq eniş */
  kneeRatio: 1.25,
  kneeScore: 70,
  kneeDrop: 30,

  /** knee-dən sonra sərt eniş */
  steepSpan: 0.25,
  steepDrop: 40,

  /** optimalMin-dən aşağı — yumşaq cəza (protection artıq sərt cəzalandırır) */
  underSpan: 0.2,
  underDrop: 25,
  underFloor: 40,
} as const;

// ─────────────────────────────────────────────────────────────
// §6 — Qüsur yaranma triggerləri (deterministik)
// ─────────────────────────────────────────────────────────────

export const DEFECT_TRIGGERS = {
  /** Overstretch bu qədər fasiləsiz saniyə davam edərsə `thinFilm` yaranır */
  thinFilmHoldSeconds: 1.2,
  /** Drag path-ın zona eninə nisbətən yan sapması */
  airBubbleLateralDeviation: 0.18,
  /** Zona bu aralıqda yarımçıq qalarsa `openCorner` */
  openCornerMinCoverage: 0.25,
  openCornerMaxCoverage: 0.9,
  /** Bundan aşağı coverage — critical severity */
  openCornerCriticalBelow: 0.25,
  /** Ümumi çəkili coverage bundan aşağıdırsa `coverageCritical` */
  criticalCoverageBelow: 0.8,
  /** Material nisbəti bunu keçərsə `excessMaterial` */
  excessMaterialRatio: 1.25,
  /** Seal bucaq sapması (dərəcə) */
  crookedSealAngleDeg: 12,
  /** Qatlama recipe-lərində sol/sağ fərqi */
  asymmetryFoldDelta: 0.08,
  /** MVP-də təsadüfi qüsur yoxdur — docs/DECISIONS.md Əlavə A5 */
  randomDefectChance: 0,
} as const;

/** Düzəltmə gesture-lərinin uğur şərtləri */
export const REPAIR_CRITERIA = {
  /** Swipe path-ın qırış zonası ilə üst-üstə düşmə nisbəti */
  wrinkleSwipeOverlap: 0.7,
  /** Hava qabarcığını kənara çəkmək üçün minimum drag (px) */
  airBubbleDragDistance: 40,
  airBubbleDirectionToleranceDeg: 45,
  /** Açıq künc bu coverage-ə çatmalıdır */
  openCornerTargetCoverage: 0.9,
  /** Düzəldilmiş seal-in maksimum bucaq sapması */
  crookedSealMaxAngleDeg: 5,
} as const;
