import type {
  CustomerPriority,
  DefectType,
  MaterialId,
  ProductId,
  Suitability,
  ZoneId,
} from './game';

/**
 * Data əsaslı arxitektura modelləri — docs/ARCHITECTURE.md §1 qayda 5.
 * Yeni məhsul/material əlavə etmək üçün yalnız `src/data/` dəyişir.
 */

export type ProductDefinition = {
  id: ProductId;
  name: string;
  localizationKey: string;
  category: 'electronics' | 'fragile' | 'food' | 'gift';
  visualType: 'box' | 'bottle' | 'tray';
  shape: {
    /** Nisbi ölçülər — Skia render-i bunları ekran ölçüsünə uyğunlaşdırır */
    width: number;
    height: number;
    depth: number;
  };
  idealMaterials: MaterialId[];
  allowedMaterials: MaterialId[];
  /** Qırılan məhsullarda əlavə qorunmalı zonalar */
  sensitiveZones: ZoneId[];
  protectionRequirement: number;
  presentationRequirement: number;
  baseReward: number;
  unlockRequirement: { reputation: number };
};

export type MaterialDefinition = {
  id: MaterialId;
  name: string;
  localizationKey: string;
  type: 'stretch' | 'cushion' | 'foil' | 'paper';
  /** Materialın öz qoruma/görünüş keyfiyyəti (0–100) */
  protectionValue: number;
  presentationValue: number;
  unitCost: number;
  interactionType: 'pull-wrap' | 'fold-wrap' | 'press-form' | 'fold-present';
  audioSet: string;
  visualConfig: {
    baseOpacity: number;
    hasSpecular: boolean;
    tintColor: string;
  };
  unlock: {
    reputation: number;
    coin: number;
  };
};

export type RecipeStep = {
  id: string;
  localizationKey: string;
  /** Bu addımda hansı gameplay state aktivdir */
  state: 'grabbingMaterial' | 'pulling' | 'wrapping' | 'cutting' | 'sealing' | 'repairing';
};

export type WrapPass = {
  index: number;
  /** Bu keçidin örtdüyü zonalar */
  zones: ZoneId[];
  /** Keçid bitdikdən sonra məhsul avtomatik fırlanırmı */
  rotateAfter: boolean;
};

export type PackagingRecipe = {
  id: string;
  productId: ProductId;
  materialId: MaterialId;
  /** Sifarişin məqsədinə görə uyğunluq — docs/DECISIONS.md §5 */
  suitability: Suitability;
  steps: RecipeStep[];
  /** docs/BALANCE.md §4 — çəkilərin cəmi 100 olmalıdır */
  zoneWeights: Record<ZoneId, number>;
  requiredZones: ZoneId[];
  wrapPasses: WrapPass[];
  /** docs/BALANCE.md §5 */
  targetMaterialUnits: number;
  /** Bu recipe-də yarana bilən qüsurlar */
  possibleDefects: DefectType[];
  /** docs/BALANCE.md §7 */
  baseReward: number;
  /** docs/BALANCE.md §13 — yalnız dizayn hədəfi, vaxt limiti deyil */
  targetDurationSeconds: [number, number];
  audioConfig: { category: string };
};

export type OrderTemplate = {
  id: string;
  recipeId: string;
  customerPriority: CustomerPriority;
  localizationKey: string;
  /** Sabit ardıcıllıqdakı mövqe (yoxdursa təsadüfi pool-a düşür) */
  sequenceIndex?: number;
  /** Tutorial sifarişi — material cəzası tətbiq edilmir (docs/DECISIONS.md §5) */
  isTutorial?: boolean;
};
