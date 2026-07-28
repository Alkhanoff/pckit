import type { PackagingRecipe } from '@/types/definitions';

/**
 * Qablaşdırma recipe-ləri.
 *
 * MVP-də yalnız vertical slice recipe-si mövcuddur (telefon qutusu + streç film).
 * Qalan recipe-lər öz mərhələlərində əlavə olunur — docs/ROADMAP.md Blok C:
 *   phone-box + bubble-wrap   → Mərhələ 13
 *   perfume + bubble-wrap     → Mərhələ 14
 *   gift-box + premium-paper  → Mərhələ 15
 *   food-tray + foil / stretch → Mərhələ 16
 *
 * Zona çəkiləri və material hədəfləri: docs/BALANCE.md §4–5.
 */

export const RECIPE_PHONE_BOX_STRETCH_FILM: PackagingRecipe = {
  id: 'phone-box__stretch-film',
  productId: 'phone-box',
  materialId: 'stretch-film',

  // Tutorial sifarişinin məqsədi tozdan/cızıqdan qoruma və səliqəli rəf
  // görünüşüdür — bu məqsəd üçün streç film idealdır (docs/DECISIONS.md §5).
  suitability: 'ideal',

  steps: [
    { id: 'grab', localizationKey: 'recipe.stretch.grab', state: 'grabbingMaterial' },
    { id: 'pull', localizationKey: 'recipe.stretch.pull', state: 'pulling' },
    { id: 'wrap-pass-1', localizationKey: 'recipe.stretch.wrapHorizontal', state: 'wrapping' },
    { id: 'wrap-pass-2', localizationKey: 'recipe.stretch.wrapVertical', state: 'wrapping' },
    { id: 'cut', localizationKey: 'recipe.stretch.cut', state: 'cutting' },
    { id: 'seal', localizationKey: 'recipe.stretch.seal', state: 'sealing' },
    { id: 'repair', localizationKey: 'recipe.stretch.repair', state: 'repairing' },
  ],

  // Cəmi = 100. Pass 1 zonaları = 70, Pass 2 zonaları = 30.
  zoneWeights: {
    front: 20,
    back: 20,
    left: 15,
    right: 15,
    top: 15,
    bottom: 15,
  },

  requiredZones: ['front', 'back', 'left', 'right', 'top', 'bottom'],

  wrapPasses: [
    { index: 1, zones: ['front', 'back', 'left', 'right'], rotateAfter: true },
    { index: 2, zones: ['top', 'bottom'], rotateAfter: false },
  ],

  targetMaterialUnits: 100,

  possibleDefects: [
    'wrinkle',
    'airBubble',
    'openCorner',
    'looseEnd',
    'thinFilm',
    'excessMaterial',
    'crookedSeal',
    'coverageCritical',
  ],

  baseReward: 100,
  targetDurationSeconds: [30, 60],
  audioConfig: { category: 'stretch' },
};

export const RECIPES: Record<string, PackagingRecipe> = {
  [RECIPE_PHONE_BOX_STRETCH_FILM.id]: RECIPE_PHONE_BOX_STRETCH_FILM,
};

export const ALL_RECIPES: PackagingRecipe[] = Object.values(RECIPES);

export function getRecipe(id: string): PackagingRecipe {
  const recipe = RECIPES[id];
  if (!recipe) throw new Error(`Naməlum recipe: ${id}`);
  return recipe;
}

export function findRecipe(productId: string, materialId: string): PackagingRecipe | undefined {
  return ALL_RECIPES.find((r) => r.productId === productId && r.materialId === materialId);
}

/** Recipe mövcuddurmu — sifariş generatoru hələ hazırlanmamış recipe-ləri filtrləyir. */
export function hasRecipe(id: string): boolean {
  return id in RECIPES;
}
