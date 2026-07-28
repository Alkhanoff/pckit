import { MATERIAL_PRICE, MATERIAL_REPUTATION_REQUIREMENT } from '@/config/progression';
import type { MaterialDefinition } from '@/types/definitions';
import type { MaterialId } from '@/types/game';

/** Material kataloqu — docs/DECISIONS.md §1. */

export const MATERIALS: Record<MaterialId, MaterialDefinition> = {
  'stretch-film': {
    id: 'stretch-film',
    name: 'Stretch Film',
    localizationKey: 'materials.stretchFilm',
    type: 'stretch',
    protectionValue: 65,
    presentationValue: 55,
    unitCost: 1,
    interactionType: 'pull-wrap',
    audioSet: 'stretch',
    visualConfig: { baseOpacity: 0.35, hasSpecular: true, tintColor: '#DCE8EF' },
    unlock: {
      reputation: MATERIAL_REPUTATION_REQUIREMENT['stretch-film'],
      coin: MATERIAL_PRICE['stretch-film'],
    },
  },

  'bubble-wrap': {
    id: 'bubble-wrap',
    name: 'Bubble Wrap',
    localizationKey: 'materials.bubbleWrap',
    type: 'cushion',
    protectionValue: 90,
    presentationValue: 45,
    unitCost: 2,
    interactionType: 'fold-wrap',
    audioSet: 'bubble',
    visualConfig: { baseOpacity: 0.5, hasSpecular: true, tintColor: '#E4EEF2' },
    unlock: {
      reputation: MATERIAL_REPUTATION_REQUIREMENT['bubble-wrap'],
      coin: MATERIAL_PRICE['bubble-wrap'],
    },
  },

  'premium-paper': {
    id: 'premium-paper',
    name: 'Premium Gift Paper',
    localizationKey: 'materials.premiumPaper',
    type: 'paper',
    protectionValue: 40,
    presentationValue: 95,
    unitCost: 4,
    interactionType: 'fold-present',
    audioSet: 'fold',
    visualConfig: { baseOpacity: 1.0, hasSpecular: false, tintColor: '#D8C3B0' },
    unlock: {
      reputation: MATERIAL_REPUTATION_REQUIREMENT['premium-paper'],
      coin: MATERIAL_PRICE['premium-paper'],
    },
  },

  foil: {
    id: 'foil',
    name: 'Aluminium Foil',
    localizationKey: 'materials.foil',
    type: 'foil',
    protectionValue: 70,
    presentationValue: 50,
    unitCost: 3,
    interactionType: 'press-form',
    audioSet: 'foil',
    visualConfig: { baseOpacity: 1.0, hasSpecular: true, tintColor: '#C9CDD2' },
    unlock: {
      reputation: MATERIAL_REPUTATION_REQUIREMENT.foil,
      coin: MATERIAL_PRICE.foil,
    },
  },
};

export const ALL_MATERIALS: MaterialDefinition[] = Object.values(MATERIALS);

export function getMaterial(id: MaterialId): MaterialDefinition {
  const material = MATERIALS[id];
  if (!material) throw new Error(`Naməlum material: ${id}`);
  return material;
}
