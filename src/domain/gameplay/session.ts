import type { PackagingRecipe } from '@/types/definitions';
import type {
  CustomerPriority,
  DefectInstance,
  GameplayState,
  MaterialId,
  ProductId,
  SealPlacement,
  Suitability,
  TensionState,
  ZoneId,
} from '@/types/game';
import { ALL_ZONES } from '@/types/game';

/**
 * Bir qablaşdırma sessiyasının tam vəziyyəti.
 * Təmiz data — heç bir metod, heç bir platform asılılığı.
 */

export type SealState = {
  placement: SealPlacement;
  angleDeg: number;
};

export type PackagingSession = {
  sessionId: string;
  recipeId: string;
  productId: ProductId;
  materialId: MaterialId;
  customerPriority: CustomerPriority;
  suitability: Suitability;
  /** Tutorial sifarişində material uyğunsuzluğu cəzası tətbiq edilmir */
  isTutorial: boolean;

  state: GameplayState;

  /** Zona üzrə örtülmə: 0–1 (1-dən yuxarı dəyər əlavə qat sayılır) */
  coverage: Record<ZoneId, number>;
  /** Zona üzrə qat sayı */
  layers: Record<ZoneId, number>;

  completedPasses: number;
  totalPasses: number;

  materialUnitsUsed: number;
  tension: TensionState;

  seal: SealState;
  defects: DefectInstance[];

  /** Qəbul edilməyən intent sayı — yalnız diaqnostika üçün */
  rejectedIntents: number;
};

function emptyZoneRecord(): Record<ZoneId, number> {
  return ALL_ZONES.reduce(
    (acc, zone) => {
      acc[zone] = 0;
      return acc;
    },
    {} as Record<ZoneId, number>,
  );
}

export type CreateSessionInput = {
  sessionId: string;
  recipe: PackagingRecipe;
  customerPriority: CustomerPriority;
  isTutorial?: boolean;
};

export function createSession({
  sessionId,
  recipe,
  customerPriority,
  isTutorial = false,
}: CreateSessionInput): PackagingSession {
  return {
    sessionId,
    recipeId: recipe.id,
    productId: recipe.productId,
    materialId: recipe.materialId,
    customerPriority,
    // Tutorial sifarişində uyğunluq həmişə `ideal` sayılır (docs/DECISIONS.md §5)
    suitability: isTutorial ? 'ideal' : recipe.suitability,
    isTutorial,

    state: 'preparing',

    coverage: emptyZoneRecord(),
    layers: emptyZoneRecord(),

    completedPasses: 0,
    totalPasses: recipe.wrapPasses.length,

    materialUnitsUsed: 0,
    tension: 'optimal',

    seal: { placement: 'missing', angleDeg: 0 },
    defects: [],

    rejectedIntents: 0,
  };
}

/** Çəkili ümumi coverage: 0–1. */
export function weightedCoverage(
  session: PackagingSession,
  zoneWeights: Record<ZoneId, number>,
): number {
  let total = 0;
  let weightSum = 0;
  for (const zone of ALL_ZONES) {
    const weight = zoneWeights[zone] ?? 0;
    if (weight === 0) continue;
    weightSum += weight;
    total += weight * Math.min(session.coverage[zone] ?? 0, 1);
  }
  return weightSum === 0 ? 0 : total / weightSum;
}

/** Düzəldilməmiş critical qüsurların sayı. */
export function openCriticalDefects(session: PackagingSession): number {
  return session.defects.filter((d) => d.severity === 'critical' && !d.repaired).length;
}
