import { PRODUCT_REPUTATION_REQUIREMENT } from '@/config/progression';
import type { ProductDefinition } from '@/types/definitions';
import type { ProductId } from '@/types/game';

/**
 * Məhsul kataloqu.
 * Yeni məhsul əlavə etmək üçün yalnız bu fayl və `recipes.ts` dəyişir —
 * gameplay kodu toxunulmur (docs/ARCHITECTURE.md §1 qayda 5).
 */

export const PRODUCTS: Record<ProductId, ProductDefinition> = {
  'phone-box': {
    id: 'phone-box',
    name: 'Phone Box',
    localizationKey: 'products.phoneBox',
    category: 'electronics',
    visualType: 'box',
    // Masada uzanır: uzun oxu uzağa gedir
    shape: { width: 1.0, depth: 1.7, height: 0.35 },
    idealMaterials: ['bubble-wrap'],
    allowedMaterials: ['stretch-film', 'bubble-wrap', 'premium-paper'],
    sensitiveZones: [],
    protectionRequirement: 60,
    presentationRequirement: 60,
    baseReward: 100,
    unlockRequirement: { reputation: PRODUCT_REPUTATION_REQUIREMENT['phone-box'] },
  },

  perfume: {
    id: 'perfume',
    name: 'Perfume Bottle',
    localizationKey: 'products.perfume',
    category: 'fragile',
    visualType: 'bottle',
    // Dik durur
    shape: { width: 0.8, depth: 0.5, height: 1.4 },
    idealMaterials: ['bubble-wrap'],
    allowedMaterials: ['bubble-wrap', 'premium-paper', 'stretch-film'],
    // Şüşə qapaq və oturacaq — qorunmazsa protection ciddi düşür
    sensitiveZones: ['top', 'bottom'],
    protectionRequirement: 85,
    presentationRequirement: 70,
    baseReward: 180,
    unlockRequirement: { reputation: PRODUCT_REPUTATION_REQUIREMENT.perfume },
  },

  'gift-box': {
    id: 'gift-box',
    name: 'Gift Box',
    localizationKey: 'products.giftBox',
    category: 'gift',
    visualType: 'box',
    shape: { width: 1.2, depth: 1.2, height: 0.8 },
    idealMaterials: ['premium-paper'],
    allowedMaterials: ['premium-paper', 'stretch-film'],
    sensitiveZones: [],
    protectionRequirement: 55,
    presentationRequirement: 90,
    baseReward: 220,
    unlockRequirement: { reputation: PRODUCT_REPUTATION_REQUIREMENT['gift-box'] },
  },

  'food-tray': {
    id: 'food-tray',
    name: 'Food Tray',
    localizationKey: 'products.foodTray',
    category: 'food',
    visualType: 'tray',
    // Alçaq tray
    shape: { width: 1.4, depth: 1.0, height: 0.3 },
    idealMaterials: ['stretch-film', 'foil'],
    allowedMaterials: ['stretch-film', 'foil'],
    // Açıq üst səth — yeməyin qorunması buradan asılıdır
    sensitiveZones: ['top'],
    protectionRequirement: 75,
    presentationRequirement: 50,
    baseReward: 140,
    unlockRequirement: { reputation: PRODUCT_REPUTATION_REQUIREMENT['food-tray'] },
  },
};

export const ALL_PRODUCTS: ProductDefinition[] = Object.values(PRODUCTS);

export function getProduct(id: ProductId): ProductDefinition {
  const product = PRODUCTS[id];
  if (!product) throw new Error(`Naməlum məhsul: ${id}`);
  return product;
}
